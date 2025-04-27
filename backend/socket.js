const socketio = require('socket.io');
const Appointment = require('./models/Appointment');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

// Initialize socket server
const initSocketServer = (server) => {
  const io = socketio(server, {
    cors: {
      origin: '*', // In production, replace with your specific domain(s)
      methods: ['GET', 'POST']
    }
  });
  
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barbershopsecret');
      socket.userId = decoded.id;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });
  
  // Handle socket connections
  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    try {
      // Get user data
      const user = await User.findById(socket.userId);
      
      if (!user) {
        socket.disconnect();
        return;
      }
      
      // Join room based on user role and ID
      socket.join(`user-${user._id}`);
      
      if (user.role === 'barber') {
        socket.join('barbers');
      } else if (user.role === 'manager') {
        socket.join('managers');
        
        // If manager has managed locations, join those rooms
        if (user.managedLocations && user.managedLocations.length > 0) {
          user.managedLocations.forEach(locationId => {
            socket.join(`salon-${locationId}`);
          });
        }
      }
      
      // Listen for queue update events
      socket.on('update-queue', async (data) => {
        try {
          const { salonId } = data;
          
          // Broadcast queue update to salon room
          io.to(`salon-${salonId}`).emit('queue-updated', { salonId });
        } catch (error) {
          console.error('Queue update error:', error);
        }
      });
      
      // Listen for appointment booking events
      socket.on('book-appointment', async (data) => {
        try {
          const { appointmentId } = data;
          
          const appointment = await Appointment.findById(appointmentId)
            .populate('customer', 'name')
            .populate('barber', 'name')
            .populate('service', 'name');
          
          if (!appointment) return;
          
          // Notify barber of new appointment
          io.to(`user-${appointment.barber._id}`).emit('new-appointment', {
            appointment,
            message: `New appointment booked with ${appointment.customer.name} for ${appointment.service.name}`
          });
          
          // Notify salon of new appointment
          io.to(`salon-${appointment.salon}`).emit('new-appointment', {
            appointment,
            message: `New appointment booked for ${appointment.service.name}`
          });
        } catch (error) {
          console.error('Appointment booking error:', error);
        }
      });
      
      // Listen for appointment update events
      socket.on('update-appointment', async (data) => {
        try {
          const { appointmentId, status } = data;
          
          const appointment = await Appointment.findById(appointmentId)
            .populate('customer', 'name')
            .populate('barber', 'name')
            .populate('service', 'name');
          
          if (!appointment) return;
          
          // Notify customer of appointment update
          io.to(`user-${appointment.customer._id}`).emit('appointment-updated', {
            appointment,
            previousStatus: appointment.status,
            newStatus: status,
            message: `Your appointment for ${appointment.service.name} has been ${status}`
          });
          
          // Notify barber of appointment update
          io.to(`user-${appointment.barber._id}`).emit('appointment-updated', {
            appointment,
            previousStatus: appointment.status,
            newStatus: status,
            message: `Appointment with ${appointment.customer.name} for ${appointment.service.name} has been ${status}`
          });
        } catch (error) {
          console.error('Appointment update error:', error);
        }
      });
      
      // Listen for emergency cancellation events
      socket.on('emergency-cancel', async (data) => {
        try {
          const { barberId, reason } = data;
          
          // Find all upcoming appointments for this barber
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const appointments = await Appointment.find({
            barber: barberId,
            date: { $gte: today },
            status: { $in: ['confirmed', 'pending'] }
          }).populate('customer', 'name').populate('service', 'name');
          
          // Mark appointments as emergency-cancelled
          await Appointment.updateMany(
            {
              barber: barberId,
              date: { $gte: today },
              status: { $in: ['confirmed', 'pending'] }
            },
            {
              status: 'emergency-cancelled',
              cancellationReason: reason,
              cancelledBy: 'system',
              cancellationTime: new Date(),
              isEmergency: true,
              emergencyDetails: reason
            }
          );
          
          // Notify affected customers
          appointments.forEach(appointment => {
            io.to(`user-${appointment.customer._id}`).emit('appointment-cancelled', {
              appointment,
              message: `Your appointment for ${appointment.service.name} has been cancelled due to an emergency: ${reason}`
            });
          });
          
          // Notify salon managers
          const barber = await User.findById(barberId, 'name');
          
          io.to('managers').emit('emergency-situation', {
            barber: barber.name,
            barberId,
            reason,
            affectedAppointments: appointments.length,
            message: `Emergency cancellation for ${barber.name}: ${reason}`
          });
        } catch (error) {
          console.error('Emergency cancellation error:', error);
        }
      });
      
      // Listen for walk-in events
      socket.on('walk-in', async (data) => {
        try {
          const { salonId, barberId, estimatedDuration } = data;
          
          // Broadcast to salon room
          io.to(`salon-${salonId}`).emit('new-walk-in', {
            salonId,
            barberId,
            estimatedDuration,
            timestamp: new Date()
          });
          
          // Notify the specific barber
          io.to(`user-${barberId}`).emit('new-walk-in', {
            salonId,
            estimatedDuration,
            timestamp: new Date(),
            message: 'You have a new walk-in customer'
          });
        } catch (error) {
          console.error('Walk-in error:', error);
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  });
  
  return io;
};

module.exports = initSocketServer; 
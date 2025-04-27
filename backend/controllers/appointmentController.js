const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Service = require('../models/Service');
const Salon = require('../models/Salon');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res) => {
  try {
    let query = {};
    
    // If user is customer, show only their appointments
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }
    
    // If user is barber, show only their appointments
    if (req.user.role === 'barber') {
      query.barber = req.user._id;
    }
    
    const appointments = await Appointment.find(query)
      .populate({
        path: 'customer',
        select: 'name email phone'
      })
      .populate({
        path: 'barber',
        select: 'name email specialties'
      })
      .populate('service')
      .sort({ date: 1, startTime: 1 });
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'customer',
        select: 'name email phone'
      })
      .populate({
        path: 'barber',
        select: 'name email specialties'
      })
      .populate('service');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    // Check if the user has permission to view this appointment
    if (req.user.role === 'customer' && appointment.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }
    
    if (req.user.role === 'barber' && appointment.barber._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }
    
    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    // Extract data needed for appointment
    const { barberId, serviceId, date, startTime, endTime, salonId } = req.body;
    
    // Validate required fields
    if (!barberId || !serviceId || !date || !startTime) {
      return res.status(400).json({ success: false, message: 'Please provide barber, service, date and time' });
    }
    
    // Validate date format
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    
    // Validate that salon is provided
    if (!salonId) {
      return res.status(400).json({ success: false, message: 'Please provide salon ID' });
    }
    
    // Check if barber exists and is active
    const barber = await User.findOne({ _id: barberId, role: 'barber', isActive: true });
    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found or inactive' });
    }
    
    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    // Check if salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Create appointment object
    const appointment = new Appointment({
      customer: req.user._id,
      barber: barberId,
      service: serviceId,
      salon: salonId,
      date: appointmentDate,
      startTime,
      endTime: endTime || startTime, // Default to startTime if endTime not provided
      status: 'pending'
    });
    
    // Add price from service
    if (service.price) {
      appointment.price = service.price;
    }
    
    // Save appointment
    await appointment.save();
    
    // Fetch full details for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customer', 'name email phone')
      .populate('barber', 'name')
      .populate('service', 'name price duration')
      .populate('salon', 'name address');
    
    // Return success with appointment data
    res.status(201).json({
      success: true,
      appointment: populatedAppointment
    });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    // Check if the user has permission to update this appointment
    if (req.user.role === 'customer' && appointment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment' });
    }
    
    if (req.user.role === 'barber' && appointment.barber.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment' });
    }
    
    // If updating status to completed or no-show, record who did it
    if (req.body.status === 'completed' || req.body.status === 'no-show') {
      if (req.user.role === 'barber') {
        req.body.completedBy = 'barber';
      } else if (req.user.role === 'manager' || req.user.role === 'admin') {
        req.body.completedBy = 'manager';
      }
    }
    
    // If updating time, check for conflicts
    if (req.body.date || req.body.startTime || req.body.endTime || req.body.barber) {
      const existingAppointment = await Appointment.findOne({
        barber: req.body.barber || appointment.barber,
        date: req.body.date || appointment.date,
        _id: { $ne: req.params.id },
        $or: [
          {
            startTime: { $lte: req.body.startTime || appointment.startTime },
            endTime: { $gt: req.body.startTime || appointment.startTime }
          },
          {
            startTime: { $lt: req.body.endTime || appointment.endTime },
            endTime: { $gte: req.body.endTime || appointment.endTime }
          },
          {
            startTime: { $gte: req.body.startTime || appointment.startTime },
            endTime: { $lte: req.body.endTime || appointment.endTime }
          }
        ]
      });
      
      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked. Please choose another time.'
        });
      }
    }
    
    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate({
      path: 'customer',
      select: 'name email phone'
    })
    .populate({
      path: 'barber',
      select: 'name email specialties'
    })
    .populate('service');
    
    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete appointment
// @route   PUT /api/appointments/:id/complete
// @access  Private (Barber/Admin only)
exports.completeAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    // Only barbers or admins/managers can complete appointments
    if (req.user.role !== 'barber' && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this appointment' });
    }
    
    // Barbers can only complete their own appointments
    if (req.user.role === 'barber' && appointment.barber.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this appointment' });
    }
    
    // Update appointment to completed
    appointment.status = 'completed';
    
    // Add notes if provided
    if (req.body.notes) {
      appointment.notes = req.body.notes;
    }
    
    // Add products used if provided
    if (req.body.productsUsed && Array.isArray(req.body.productsUsed)) {
      appointment.productsUsed = req.body.productsUsed;
    }
    
    // Record who completed it
    if (req.user.role === 'barber') {
      appointment.completedBy = 'barber';
    } else {
      appointment.completedBy = 'manager';
    }
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    // Check if the user has permission to cancel this appointment
    if (req.user.role === 'customer' && appointment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }
    
    // Allow barbers to cancel their own appointments
    if (req.user.role === 'barber' && appointment.barber.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }
    
    // Managers and admins can cancel any appointment
    
    // Update status to cancelled
    appointment.status = 'cancelled';
    appointment.cancellationTime = new Date();
    
    // Set who cancelled based on role
    if (req.user.role === 'customer') {
      appointment.cancelledBy = 'customer';
    } else if (req.user.role === 'barber') {
      appointment.cancelledBy = 'barber';
    } else if (req.user.role === 'manager' || req.user.role === 'admin') {
      appointment.cancelledBy = 'manager';
    } else {
      appointment.cancelledBy = 'system';
    }
    
    // Add cancellation reason if provided
    if (req.body.cancellationReason) {
      appointment.cancellationReason = req.body.cancellationReason;
    }
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get barber availability for a specific date
// @route   GET /api/appointments/availability/:barberId
// @access  Private
exports.getBarberAvailability = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date, salonId } = req.query;
    
    console.log('Availability request received:', { barberId, date, salonId });
    
    if (!barberId || !date || !salonId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide barberId, date, and salonId' 
      });
    }
    
    // Check if barber exists
    const barber = await User.findOne({ _id: barberId, role: 'barber' });
    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }
    
    // For testing, always return all time slots as available
    const allTimeSlots = [];
    for (let hour = 9; hour <= 17; hour++) {
      allTimeSlots.push(`${hour}:00`);
      allTimeSlots.push(`${hour}:30`);
    }
    
    console.log('Returning available times:', allTimeSlots);
    
    res.status(200).json({
      success: true,
      date,
      barberId,
      salonId,
      availableTimes: allTimeSlots
    });
  } catch (error) {
    console.error('Error getting barber availability:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Salon = require('../models/Salon');

// @desc    Get barber statistics
// @route   GET /api/manager/barber/:id/stats
// @access  Private/Manager/Admin
exports.getBarberStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'week' } = req.query;
    
    // Verify barber exists
    const barber = await User.findById(id);
    
    if (!barber || barber.role !== 'barber') {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }
    
    // Calculate date range based on period
    const today = new Date();
    let startDate = new Date(today);
    
    switch (period) {
      case 'day':
        // Just today
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        // Last 7 days
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        // Last 30 days
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        // Default to week
        startDate.setDate(today.getDate() - 7);
    }
    
    // Get appointments for this barber in the date range
    const appointments = await Appointment.find({
      barber: id,
      date: { $gte: startDate, $lte: today }
    });
    
    // Count unique clients
    const uniqueClients = new Set();
    appointments.forEach(appointment => {
      uniqueClients.add(appointment.customer.toString());
    });
    
    // Calculate total revenue
    const revenue = appointments.reduce((total, appointment) => {
      if (appointment.status === 'completed' && appointment.payment && appointment.payment.paid) {
        return total + (appointment.payment.amount || 0);
      }
      return total;
    }, 0);
    
    // Get completed appointments count
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    
    // Count appointments by status
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };
    
    appointments.forEach(appointment => {
      if (statusCounts.hasOwnProperty(appointment.status)) {
        statusCounts[appointment.status]++;
      }
    });
    
    res.status(200).json({
      success: true,
      stats: {
        period,
        appointmentsCount: appointments.length,
        completedAppointments,
        clientsCount: uniqueClients.size,
        revenue,
        statusCounts
      }
    });
  } catch (error) {
    console.error('Error getting barber stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get barber appointments
// @route   GET /api/manager/barber/:id/appointments
// @access  Private/Manager/Admin
exports.getBarberAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'week', status } = req.query;
    
    // Verify barber exists
    const barber = await User.findById(id);
    
    if (!barber || barber.role !== 'barber') {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }
    
    // Calculate date range based on period
    const today = new Date();
    let startDate = new Date(today);
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        startDate.setDate(today.getDate() - 7);
    }
    
    // Build query
    const query = {
      barber: id,
      date: { $gte: startDate, $lte: today }
    };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Get appointments with customer and service details
    const appointments = await Appointment.find(query)
      .populate('customer', 'name email phone')
      .populate('service', 'name price duration')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Error getting barber appointments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get barber schedule for today
// @route   GET /api/manager/barber/:id/schedule
// @access  Private/Manager/Admin
exports.getBarberSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    // Verify barber exists
    const barber = await User.findById(id);
    
    if (!barber || barber.role !== 'barber') {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }
    
    // Parse date or use today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    // Find the day of week (0 = Sunday, 1 = Monday, etc)
    const dayOfWeek = targetDate.getDay();
    
    // Check if barber works on this day
    const workDay = barber.workSchedule?.find(day => day.day === dayOfWeek);
    
    if (!workDay || !workDay.isWorking) {
      return res.status(200).json({
        success: true,
        message: 'Barber is not scheduled to work on this day',
        isWorkDay: false,
        schedule: []
      });
    }
    
    // Get work hours
    const startTime = workDay.startTime;
    const endTime = workDay.endTime;
    
    // Get appointments for this day
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await Appointment.find({
      barber: id,
      date: { $gte: targetDate, $lte: endOfDay }
    });
    
    // Create time slots (30 min intervals)
    const timeSlots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const slotStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Advance 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
      
      const slotEndTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Check if slot is booked
      const isBooked = appointments.some(appointment => {
        return appointment.startTime === slotStartTime;
      });
      
      const bookedAppointment = appointments.find(appointment => appointment.startTime === slotStartTime);
      
      timeSlots.push({
        startTime: slotStartTime,
        endTime: slotEndTime,
        status: isBooked ? 'booked' : 'free',
        appointment: bookedAppointment ? {
          id: bookedAppointment._id,
          customer: bookedAppointment.customer,
          service: bookedAppointment.service,
          status: bookedAppointment.status
        } : null
      });
    }
    
    res.status(200).json({
      success: true,
      isWorkDay: true,
      schedule: {
        date: targetDate,
        startTime,
        endTime,
        timeSlots
      }
    });
  } catch (error) {
    console.error('Error getting barber schedule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salon stats for manager
// @route   GET /api/manager/salon/:id/stats
// @access  Private/Manager/Admin
exports.getSalonStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'week' } = req.query;
    
    // Verify salon exists
    const salon = await Salon.findById(id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Verify manager has access to this salon
    if (req.user.role === 'manager' && !req.user.managedLocations.includes(id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this salon' });
    }
    
    // Calculate date range based on period
    const today = new Date();
    let startDate = new Date(today);
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        startDate.setDate(today.getDate() - 7);
    }
    
    // Get all appointments for this salon in the date range
    const appointments = await Appointment.find({
      salon: id,
      date: { $gte: startDate, $lte: today }
    }).populate('customer', 'name email').populate('barber', 'name');
    
    // Count unique clients
    const uniqueClients = new Set();
    appointments.forEach(appointment => {
      if (appointment.customer) {
        uniqueClients.add(appointment.customer._id.toString());
      }
    });
    
    // Calculate total revenue
    const revenue = appointments.reduce((total, appointment) => {
      if (appointment.status === 'completed' && appointment.payment && appointment.payment.paid) {
        return total + (appointment.payment.amount || 0);
      }
      return total;
    }, 0);
    
    // Count appointments by status
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };
    
    appointments.forEach(appointment => {
      if (statusCounts.hasOwnProperty(appointment.status)) {
        statusCounts[appointment.status]++;
      }
    });
    
    // Get daily appointment counts for the period
    const dailyAppointments = {};
    const days = Math.min(30, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
    
    // Initialize the daily counts with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyAppointments[dateString] = 0;
    }
    
    // Fill in the actual counts
    appointments.forEach(appointment => {
      const dateString = new Date(appointment.date).toISOString().split('T')[0];
      if (dailyAppointments.hasOwnProperty(dateString)) {
        dailyAppointments[dateString]++;
      }
    });
    
    res.status(200).json({
      success: true,
      stats: {
        period,
        appointmentsCount: appointments.length,
        clientsCount: uniqueClients.size,
        revenue,
        statusCounts,
        dailyAppointments
      }
    });
  } catch (error) {
    console.error('Error getting salon stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salon customers
// @route   GET /api/manager/salon/:id/customers
// @access  Private/Manager/Admin
exports.getSalonCustomers = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;
    
    // Verify salon exists
    const salon = await Salon.findById(id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Verify manager has access to this salon
    if (req.user.role === 'manager' && !req.user.managedLocations.includes(id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this salon' });
    }
    
    // Calculate date range based on period
    const today = new Date();
    let startDate = new Date(today);
    
    switch (period) {
      case 'month':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    // Get all appointments for this salon with customer details
    const appointments = await Appointment.find({
      salon: id,
      date: { $gte: startDate }
    }).populate('customer', 'name email phone').populate('service', 'name price');
    
    // Extract unique customers with their visit details
    const customerMap = new Map();
    
    appointments.forEach(appointment => {
      if (!appointment.customer) return;
      
      const customerId = appointment.customer._id.toString();
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          _id: customerId,
          name: appointment.customer.name,
          email: appointment.customer.email,
          phone: appointment.customer.phone,
          visits: 0,
          lastVisit: null,
          totalSpent: 0,
          appointments: []
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.visits++;
      
      // Track last visit date
      const appointmentDate = new Date(appointment.date);
      if (!customer.lastVisit || appointmentDate > customer.lastVisit) {
        customer.lastVisit = appointmentDate;
      }
      
      // Add to total spent if completed
      if (appointment.status === 'completed' && appointment.service) {
        customer.totalSpent += (appointment.service.price || 0);
      }
      
      // Add to appointments
      customer.appointments.push({
        id: appointment._id,
        date: appointment.date,
        service: appointment.service?.name || 'Unknown Service',
        status: appointment.status
      });
    });
    
    // Convert map to array and sort by visits (descending)
    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.visits - a.visits);
    
    res.status(200).json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('Error getting salon customers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get manager's salons
// @route   GET /api/manager/salons
// @access  Private/Manager/Admin
exports.getManagerSalons = async (req, res) => {
  try {
    let salons;
    
    if (req.user.role === 'admin') {
      // Admins can see all salons
      salons = await Salon.find().populate('managers', 'name email');
    } else {
      // Managers can only see their managed salons
      const manager = await User.findById(req.user._id).populate('managedLocations');
      salons = manager.managedLocations || [];
    }
    
    res.status(200).json({
      success: true,
      count: salons.length,
      salons
    });
  } catch (error) {
    console.error('Error getting manager salons:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 
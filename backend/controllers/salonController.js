const Salon = require('../models/Salon');
const User = require('../models/User');
const Service = require('../models/Service');

// @desc    Get all salons
// @route   GET /api/salons
// @access  Public
exports.getSalons = async (req, res) => {
  try {
    const salons = await Salon.find({ isActive: true });
    
    res.status(200).json({
      success: true,
      count: salons.length,
      salons
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salons near location
// @route   GET /api/salons/near
// @access  Public
exports.getNearSalons = async (req, res) => {
  try {
    const { lat, lng, radius = 3 } = req.query; // default radius 3km
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide latitude and longitude coordinates' 
      });
    }
    
    // Convert radius from km to meters for MongoDB
    const radiusInMeters = radius * 1000;
    
    // Find salons near the given coordinates
    const salons = await Salon.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      },
      isActive: true
    }).populate('services', 'name nameAr nameFr category price duration');
    
    res.status(200).json({
      success: true,
      count: salons.length,
      salons
    });
  } catch (error) {
    console.error('Error finding nearby salons:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salon by ID
// @route   GET /api/salons/:id
// @access  Public
exports.getSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id)
      .populate('services')
      .populate({
        path: 'staff',
        select: 'name profileImage role skills specialties serviceCapacity workSchedule'
      });
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Log the populated salon object for debugging
    console.log(`Fetched salon ${salon.name} with ${salon.staff.length} staff members`);
    
    res.status(200).json({
      success: true,
      salon
    });
  } catch (error) {
    console.error('Error fetching salon:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a salon
// @route   POST /api/salons
// @access  Private (Manager/Admin)
exports.createSalon = async (req, res) => {
  try {
    // Extract and format location data
    const { address, coordinates, ...salonData } = req.body;
    
    // Create salon with properly formatted geolocation
    const salon = await Salon.create({
      ...salonData,
      address,
      location: {
        type: 'Point',
        coordinates: coordinates // [longitude, latitude]
      }
    });
    
    // If user is manager, add salon to managed locations
    if (req.user.role === 'manager') {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { managedLocations: salon._id }
      });
    }
    
    res.status(201).json({
      success: true,
      salon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a salon
// @route   PUT /api/salons/:id
// @access  Private (Manager/Admin)
exports.updateSalon = async (req, res) => {
  try {
    let salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Check if manager has permission to update this salon
    if (req.user.role === 'manager' && !req.user.managedLocations.includes(salon._id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this salon' 
      });
    }
    
    // Handle location update if provided
    if (req.body.coordinates) {
      req.body.location = {
        type: 'Point',
        coordinates: req.body.coordinates
      };
      delete req.body.coordinates;
    }
    
    salon = await Salon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      salon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a salon (mark as inactive)
// @route   DELETE /api/salons/:id
// @access  Private (Admin)
exports.deleteSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Soft delete - just mark as inactive
    salon.isActive = false;
    await salon.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add staff to salon
// @route   POST /api/salons/:id/staff
// @access  Private (Manager/Admin)
exports.addStaffToSalon = async (req, res) => {
  try {
    const { staffId } = req.body;
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Check if staff exists and is a barber
    const staff = await User.findById(staffId);
    if (!staff || (staff.role !== 'barber' && staff.role !== 'manager')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid staff member' 
      });
    }
    
    // Add staff to salon
    if (!salon.staff.includes(staffId)) {
      salon.staff.push(staffId);
      await salon.save();
    }
    
    res.status(200).json({
      success: true,
      salon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove staff from salon
// @route   DELETE /api/salons/:id/staff/:staffId
// @access  Private (Manager/Admin)
exports.removeStaffFromSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Remove staff from salon
    salon.staff = salon.staff.filter(
      staff => staff.toString() !== req.params.staffId
    );
    await salon.save();
    
    res.status(200).json({
      success: true,
      salon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add service to salon
// @route   POST /api/salons/:id/services
// @access  Private (Manager/Admin)
exports.addServiceToSalon = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid service' 
      });
    }
    
    // Add service to salon
    if (!salon.services.includes(serviceId)) {
      salon.services.push(serviceId);
      await salon.save();
    }
    
    res.status(200).json({
      success: true,
      salon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove service from salon
// @route   DELETE /api/salons/:id/services/:serviceId
// @access  Private (Manager/Admin)
exports.removeServiceFromSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Remove service from salon
    salon.services = salon.services.filter(
      service => service.toString() !== req.params.serviceId
    );
    await salon.save();
    
    res.status(200).json({
      success: true,
      salon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update salon inventory
// @route   PUT /api/salons/:id/inventory
// @access  Private (Manager/Admin)
exports.updateInventory = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Update inventory products
    const { products } = req.body;
    
    if (products && Array.isArray(products)) {
      // Update existing products or add new ones
      products.forEach(product => {
        const existingProduct = salon.inventory.find(
          item => item.product === product.product
        );
        
        if (existingProduct) {
          existingProduct.quantity = product.quantity;
          existingProduct.threshold = product.threshold || existingProduct.threshold;
          existingProduct.unit = product.unit || existingProduct.unit;
        } else {
          salon.inventory.push(product);
        }
      });
      
      await salon.save();
    }
    
    res.status(200).json({
      success: true,
      inventory: salon.inventory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salon revenue reports
// @route   GET /api/salons/:id/revenue
// @access  Private (Manager/Admin)
exports.getSalonRevenue = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Aggregate revenue data from appointments
    // This would be extended with more detailed queries in a real implementation
    
    res.status(200).json({
      success: true,
      revenue: salon.revenueStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salon statistics
// @route   GET /api/admin/salons/:id/stats
// @access  Private (Admin)
exports.getSalonStatsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'week' } = req.query;
    
    // Verify salon exists
    const salon = await Salon.findById(id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Get appointments for this salon
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
    
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({
      salon: id,
      date: { $gte: startDate, $lte: today }
    }).populate('customer', 'name email');
    
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
    
    // Group appointments by day
    const appointmentsByDay = {};
    appointments.forEach(appointment => {
      const day = appointment.date.toISOString().split('T')[0];
      if (!appointmentsByDay[day]) {
        appointmentsByDay[day] = 0;
      }
      appointmentsByDay[day]++;
    });
    
    res.status(200).json({
      success: true,
      stats: {
        period,
        appointmentsCount: appointments.length,
        completedAppointments,
        clientsCount: uniqueClients.size,
        revenue,
        statusCounts,
        appointmentsByDay
      }
    });
  } catch (error) {
    console.error('Error getting salon stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salon customer count by date
// @route   GET /api/admin/salons/:id/customers
// @access  Private (Admin)
exports.getSalonCustomerCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Verify salon exists
    const salon = await Salon.findById(id);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Set default date range if not provided
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }
    
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({
      salon: id,
      date: { $gte: start, $lte: end }
    }).populate('customer', 'name email');
    
    // Count customers by date
    const customersByDate = {};
    const dateArray = [];
    
    // Initialize all dates in the range with zero count
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const dateStr = tempDate.toISOString().split('T')[0];
      customersByDate[dateStr] = {
        count: 0,
        customers: []
      };
      dateArray.push(dateStr);
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    // Count customers for each date
    appointments.forEach(appointment => {
      if (appointment.customer) {
        const dateStr = appointment.date.toISOString().split('T')[0];
        if (customersByDate[dateStr]) {
          customersByDate[dateStr].count++;
          customersByDate[dateStr].customers.push({
            id: appointment.customer._id,
            name: appointment.customer.name,
            time: appointment.startTime,
            status: appointment.status
          });
        }
      }
    });
    
    // Total unique customers in the date range
    const uniqueCustomers = new Set();
    appointments.forEach(appointment => {
      if (appointment.customer) {
        uniqueCustomers.add(appointment.customer._id.toString());
      }
    });
    
    res.status(200).json({
      success: true,
      totalUniqueCustomers: uniqueCustomers.size,
      totalAppointments: appointments.length,
      dates: dateArray,
      customersByDate
    });
  } catch (error) {
    console.error('Error getting salon customer count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 
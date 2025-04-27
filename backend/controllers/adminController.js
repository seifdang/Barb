const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create user
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    console.log('Creating user, received data:', req.body);
    const { 
      name, 
      email, 
      password, 
      phone, 
      role, 
      staffId,
      isActive,
      joinDate,
      employmentDetails
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email, and password' 
      });
    }
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      console.log(`User with email ${email} already exists`);
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Validate role
    if (!['customer', 'barber', 'manager', 'admin'].includes(role)) {
      console.log(`Invalid role: ${role}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }

    // Check if staffId already exists (for staff roles)
    if (staffId && ['barber', 'manager'].includes(role)) {
      const staffIdExists = await User.findOne({ staffId });
      if (staffIdExists) {
        console.log(`Staff ID ${staffId} already exists`);
        return res.status(400).json({ 
          success: false, 
          message: 'Staff ID already exists' 
        });
      }
    }
    
    // Create user with professional fields
    console.log('Creating new user with role:', role);
    const userData = {
      name,
      email,
      password,
      phone,
      role
    };

    // Add professional staff fields if role is staff (barber or manager)
    if (['barber', 'manager'].includes(role)) {
      userData.staffId = staffId;
      userData.isActive = isActive || true;
      userData.joinDate = joinDate || new Date();
      
      // Add employment details if provided
      if (employmentDetails) {
        userData.employmentDetails = employmentDetails;
      }

      // Set default skills for barbers
      if (role === 'barber') {
        userData.skills = {
          barber: true,
          colorist: false,
          extensionsSpecialist: false
        };
      }
    }

    const user = await User.create(userData);
    
    console.log('User created successfully:', user._id);
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        staffId: user.staffId,
        isActive: user.isActive,
        joinDate: user.joinDate
      }
    });
  } catch (error) {
    console.error('Error in createUser:', error.message);
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      const messages = Object.values(error.errors).map(val => val.message);
      console.log('Validation error:', messages);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role, 
      phone, 
      staffId, 
      isActive,
      employmentDetails
    } = req.body;
    
    // Get user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // If email is being changed, check if it's already in use
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    // If staffId is being changed, check if it's already in use
    if (staffId && staffId !== user.staffId) {
      const staffIdExists = await User.findOne({ staffId });
      
      if (staffIdExists) {
        return res.status(400).json({ success: false, message: 'Staff ID already in use' });
      }
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (staffId) user.staffId = staffId;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Update employment details if provided
    if (employmentDetails) {
      user.employmentDetails = {
        ...user.employmentDetails,
        ...employmentDetails
      };
    }
    
    // If password included, it will be hashed by the pre-save hook
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        staffId: updatedUser.staffId,
        isActive: updatedUser.isActive,
        joinDate: updatedUser.joinDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await user.remove();
    
    res.status(200).json({
      success: true,
      message: 'User removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Count users by role
    const customerCount = await User.countDocuments({ role: 'customer' });
    const barberCount = await User.countDocuments({ role: 'barber' });
    const managerCount = await User.countDocuments({ role: 'manager' });
    
    // Count appointments by status
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
    
    // Get revenue stats 
    const appointmentsWithPayment = await Appointment.find({ 
      status: 'completed',
      'payment.paid': true 
    });
    
    const totalRevenue = appointmentsWithPayment.reduce((total, appointment) => {
      return total + (appointment.payment.amount || 0);
    }, 0);
    
    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: customerCount + barberCount + managerCount,
          customers: customerCount,
          barbers: barberCount,
          managers: managerCount
        },
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments
        },
        revenue: {
          total: totalRevenue
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 
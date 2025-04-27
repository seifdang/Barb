const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Salon = require('../models/Salon');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'barbershopsecret', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Set admin role for specific email
    let userRole = role || 'customer';
    if (email === 'seif.ayadi.3.9.2@gmail.com') {
      userRole = 'admin';
      console.log('Admin account detected and created for:', email);
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: userRole
    });
    
    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.status(200).json({
        success: true,
        user
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.profileImage = req.body.profileImage || user.profileImage;
      
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
          profileImage: updatedUser.profileImage,
          token: generateToken(updatedUser._id)
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all barbers
// @route   GET /api/users/barbers
// @access  Public
exports.getBarbers = async (req, res) => {
  try {
    // Check if we have any barbers
    const barberCount = await User.countDocuments({ role: 'barber' });
    
    // If no barbers, create a test barber for demo purposes
    if (barberCount === 0) {
      console.log('No barbers found. Creating test barbers...');
      
      // Create test barbers with different specialties
      await User.create({
        name: 'John Barber',
        email: 'john.barber@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '123-456-7890',
        role: 'barber',
        profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
        specialties: ['Haircut', 'Beard Trim', 'Hot Towel Shave'],
        skills: { barber: true, colorist: false, extensionsSpecialist: false },
        workSchedule: [
          { day: 1, startTime: '09:00', endTime: '17:00', isWorking: true },
          { day: 2, startTime: '09:00', endTime: '17:00', isWorking: true },
          { day: 3, startTime: '09:00', endTime: '17:00', isWorking: true },
          { day: 4, startTime: '09:00', endTime: '17:00', isWorking: true },
          { day: 5, startTime: '09:00', endTime: '17:00', isWorking: true },
        ]
      });
      
      await User.create({
        name: 'Sarah Stylist',
        email: 'sarah.stylist@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '123-456-7891',
        role: 'barber',
        profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
        specialties: ['Women\'s Haircut', 'Color', 'Highlights'],
        skills: { barber: true, colorist: true, extensionsSpecialist: false },
        workSchedule: [
          { day: 1, startTime: '10:00', endTime: '18:00', isWorking: true },
          { day: 2, startTime: '10:00', endTime: '18:00', isWorking: true },
          { day: 3, startTime: '10:00', endTime: '18:00', isWorking: true },
          { day: 4, startTime: '10:00', endTime: '18:00', isWorking: true },
          { day: 5, startTime: '10:00', endTime: '18:00', isWorking: true },
        ]
      });
      
      console.log('Test barbers created successfully');
    }
    
    // Get all barbers with populated fields
    const barbers = await User.find({ role: 'barber' })
      .select('-password')
      .lean();
    
    // Log the number of barbers found
    console.log(`Found ${barbers.length} barbers`);
    
    res.status(200).json({
      success: true,
      count: barbers.length,
      barbers
    });
  } catch (error) {
    console.error('Error in getBarbers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get salons where barber works
// @route   GET /api/users/barber/:id/salons
// @access  Private
exports.getBarberSalons = async (req, res) => {
  try {
    const barberId = req.params.id;
    
    // Validate barber exists
    const barber = await User.findOne({ _id: barberId, role: 'barber' });
    
    if (!barber) {
      return res.status(404).json({ success: false, message: 'Barber not found' });
    }
    
    // Find all salons that have this barber in their staff
    const salons = await Salon.find({ staff: barberId });
    
    res.status(200).json({
      success: true,
      count: salons.length,
      salons
    });
  } catch (error) {
    console.error('Error getting barber salons:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 
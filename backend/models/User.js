const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'barber', 'manager', 'admin'],
    default: 'customer'
  },
  // Staff professional fields
  staffId: {
    type: String,
    unique: true,
    sparse: true // Allow null values to be unique too
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date
  },
  // Employee details for staff members
  employmentDetails: {
    position: String,
    department: String,
    salary: Number,
    hireDate: Date,
    certifications: [String]
  },
  profileImage: {
    type: String,
    default: ''
  },
  // Location data for geolocation
  location: {
    address: String,
    city: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  // Worker specific fields
  specialties: {
    type: [String],
    default: []
  },
  skills: {
    barber: { type: Boolean, default: false },
    colorist: { type: Boolean, default: false },
    extensionsSpecialist: { type: Boolean, default: false }
  },
  serviceCapacity: {
    haircuts: { type: Number, default: 4 }, // per hour
    coloring: { type: Number, default: 2 }, // per hour
    extensions: { type: Number, default: 1 } // per hour
  },
  // For worker shift management
  workSchedule: [{
    day: { type: Number, required: true }, // 0=Sunday, 1=Monday, etc
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isWorking: { type: Boolean, default: true }
  }],
  // Manager specific fields
  managedLocations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon'
  }],
  // Customer specific fields
  preferredLanguage: {
    type: String,
    enum: ['en', 'ar', 'fr'],
    default: 'en'
  },
  stylePreferences: {
    type: String
  },
  // Service history will be pulled from appointments
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 
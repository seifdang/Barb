const mongoose = require('mongoose');

const SalonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String
    },
    postalCode: {
      type: String
    }
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  description: {
    type: String
  },
  images: [{
    type: String
  }],
  operatingHours: [{
    day: { type: Number, required: true }, // 0=Sunday, 1=Monday, etc.
    open: { type: String, required: true },
    close: { type: String, required: true },
    isClosed: { type: Boolean, default: false }
  }],
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  managers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For inventory tracking
  inventory: [{
    product: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0
    },
    threshold: {
      type: Number, // Alert threshold
      default: 10
    },
    unit: {
      type: String,
      default: 'item'
    }
  }],
  // For reporting
  revenueStats: {
    daily: {
      type: Map,
      of: Number
    },
    monthly: {
      type: Map,
      of: Number
    },
    yearly: {
      type: Map,
      of: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a 2dsphere index for geolocation queries
SalonSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Salon', SalonSchema); 
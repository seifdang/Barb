const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  nameAr: {
    type: String
  },
  nameFr: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  descriptionAr: {
    type: String
  },
  descriptionFr: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // duration in minutes
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['haircut', 'beard', 'combo', 'specialty', 'coloring', 'extensions'],
    default: 'haircut'
  },
  // For determining which staff can perform this service
  requiredSkills: {
    barber: { type: Boolean, default: true },
    colorist: { type: Boolean, default: false },
    extensionsSpecialist: { type: Boolean, default: false }
  },
  // For inventory tracking
  productsUsed: [{
    product: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'ml'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', ServiceSchema); 
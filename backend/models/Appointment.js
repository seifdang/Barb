const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  salon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'emergency-cancelled'],
    default: 'pending'
  },
  // For walk-ins
  isWalkIn: {
    type: Boolean,
    default: false
  },
  queueNumber: {
    type: Number
  },
  estimatedWaitTime: {
    type: Number // in minutes
  },
  // For cancellations
  cancellationReason: {
    type: String
  },
  cancelledBy: {
    type: String,
    enum: ['customer', 'barber', 'manager', 'system']
  },
  cancellationTime: {
    type: Date
  },
  // For emergency protocol
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyDetails: {
    type: String
  },
  // For inventory tracking
  productsUsed: [{
    product: {
      type: String
    },
    quantity: {
      type: Number
    },
    unit: {
      type: String,
      default: 'ml'
    }
  }],
  // For payment tracking
  price: {
    type: Number
  },
  priceInDT: {
    type: Number // Price in Tunisian Dinar
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'debit', 'mobile']
  },
  // For review and feedback
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
AppointmentSchema.index({ barber: 1, date: 1, status: 1 });
AppointmentSchema.index({ customer: 1, date: 1, status: 1 });
AppointmentSchema.index({ salon: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema); 
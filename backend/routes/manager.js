const express = require('express');
const router = express.Router();
const {
  getBarberStats,
  getBarberAppointments,
  getBarberSchedule,
  getSalonStats,
  getSalonCustomers,
  getManagerSalons
} = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/auth');

// All routes in this file are protected and require manager or admin role
router.use(protect, authorize('manager', 'admin'));

// Barber statistics routes
router.get('/barber/:id/stats', getBarberStats);
router.get('/barber/:id/appointments', getBarberAppointments);
router.get('/barber/:id/schedule', getBarberSchedule);

// Salon routes for managers
router.get('/salons', getManagerSalons);
router.get('/salon/:id/stats', getSalonStats);
router.get('/salon/:id/customers', getSalonCustomers);

module.exports = router; 
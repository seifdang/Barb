const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  getBarberAvailability
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getAppointments)
  .post(createAppointment);

router.route('/availability/:barberId')
  .get(getBarberAvailability);

router.route('/:id')
  .get(getAppointment)
  .put(updateAppointment)
  .delete(cancelAppointment);

router.route('/:id/complete')
  .put(completeAppointment);

module.exports = router; 
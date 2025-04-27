const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats
} = require('../controllers/adminController');
const {
  getSalons,
  getSalon,
  createSalon,
  updateSalon,
  deleteSalon,
  addStaffToSalon,
  removeStaffFromSalon,
  getSalonStatsById,
  getSalonCustomerCount
} = require('../controllers/salonController');
const { protect, authorize } = require('../middleware/auth');

// All routes in this file are protected and require admin role
router.use(protect, authorize('admin'));

// User management routes
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Salon management routes for admin
router.route('/salons')
  .get(getSalons)
  .post(createSalon);

router.route('/salons/:id')
  .get(getSalon)
  .put(updateSalon)
  .delete(deleteSalon);

router.route('/salons/:id/staff')
  .post(addStaffToSalon);

router.route('/salons/:id/staff/:staffId')
  .delete(removeStaffFromSalon);

router.route('/salons/:id/stats')
  .get(getSalonStatsById);

router.route('/salons/:id/customers')
  .get(getSalonCustomerCount);

// Statistics routes
router.get('/stats', getDashboardStats);

module.exports = router; 
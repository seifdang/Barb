const express = require('express');
const router = express.Router();
const {
  getSalons,
  getNearSalons,
  getSalon,
  createSalon,
  updateSalon,
  deleteSalon,
  addStaffToSalon,
  removeStaffFromSalon,
  addServiceToSalon,
  removeServiceFromSalon,
  updateInventory,
  getSalonRevenue
} = require('../controllers/salonController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getSalons);
router.get('/near', getNearSalons);
router.get('/:id', getSalon);

// Protected routes - Manager/Admin only
router.post('/', protect, authorize('manager', 'admin'), createSalon);
router.put('/:id', protect, authorize('manager', 'admin'), updateSalon);
router.delete('/:id', protect, authorize('admin'), deleteSalon);

// Staff management
router.post('/:id/staff', protect, authorize('manager', 'admin'), addStaffToSalon);
router.delete('/:id/staff/:staffId', protect, authorize('manager', 'admin'), removeStaffFromSalon);

// Service management
router.post('/:id/services', protect, authorize('manager', 'admin'), addServiceToSalon);
router.delete('/:id/services/:serviceId', protect, authorize('manager', 'admin'), removeServiceFromSalon);

// Inventory management
router.put('/:id/inventory', protect, authorize('manager', 'admin'), updateInventory);

// Reporting
router.get('/:id/revenue', protect, authorize('manager', 'admin'), getSalonRevenue);

module.exports = router; 
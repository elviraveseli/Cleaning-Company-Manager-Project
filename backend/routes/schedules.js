const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// GET /api/schedules - Get all schedules (list)
router.get('/', scheduleController.getSchedules);

// GET /api/schedules/:id - Get single schedule (details)
router.get('/:id', scheduleController.getScheduleById);

// POST /api/schedules - Create new schedule
router.post('/', scheduleController.createSchedule);

// PUT /api/schedules/:id - Update schedule
router.put('/:id', scheduleController.updateSchedule);

// DELETE /api/schedules/:id - Delete schedule
router.delete('/:id', scheduleController.deleteSchedule);

// Additional routes for schedule management
router.patch('/:id/date', scheduleController.updateScheduleDate);
router.post('/:id/employees', scheduleController.assignEmployee);
router.delete('/:id/employees/:employeeId', scheduleController.removeEmployee);
router.patch('/:id/contract', scheduleController.assignContract);

module.exports = router; 
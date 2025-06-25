const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// GET /api/employees - Get all employees (list)
router.get('/', employeeController.getEmployees);

// GET /api/employees/stats - Get employee statistics
router.get('/stats', employeeController.getEmployeeStats);

// GET /api/employees/:id - Get single employee (details)
router.get('/:id', employeeController.getEmployee);

// POST /api/employees - Create new employee
router.post('/', employeeController.createEmployee);

// PUT /api/employees/:id - Update employee
router.put('/:id', employeeController.updateEmployee);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router; 
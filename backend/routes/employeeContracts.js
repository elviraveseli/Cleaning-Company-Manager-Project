const express = require('express');
const router = express.Router();
const employeeContractController = require('../controllers/employeeContractController');

// GET /api/employee-contracts - Get all employee contracts (list)
router.get('/', employeeContractController.getEmployeeContracts);

// GET /api/employee-contracts/employee/:employeeId - Get contracts by employee
router.get('/employee/:employeeId', employeeContractController.getContractsByEmployee);

// GET /api/employee-contracts/:id - Get single employee contract (details)
router.get('/:id', employeeContractController.getEmployeeContract);

// POST /api/employee-contracts - Create new employee contract
router.post('/', employeeContractController.createEmployeeContract);

// PUT /api/employee-contracts/:id - Update employee contract
router.put('/:id', employeeContractController.updateEmployeeContract);

// DELETE /api/employee-contracts/:id - Delete employee contract
router.delete('/:id', employeeContractController.deleteEmployeeContract);

// POST /api/employee-contracts/:id/send-email - Send employee contract email
router.post('/:id/send-email', employeeContractController.sendEmployeeContractEmail);

module.exports = router; 
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// GET /api/customers - Get all customers (list)
router.get('/', customerController.getCustomers);

// GET /api/customers/type/:customerType - Get customers by type
router.get('/type/:customerType', customerController.getCustomersByType);

// GET /api/customers/status/:status - Get customers by status
router.get('/status/:status', customerController.getCustomersByStatus);

// GET /api/customers/:id - Get single customer (details)
router.get('/:id', customerController.getCustomer);

// POST /api/customers - Create new customer
router.post('/', customerController.createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router; 
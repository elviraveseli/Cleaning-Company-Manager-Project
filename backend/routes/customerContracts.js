const express = require('express');
const router = express.Router();
const customerContractController = require('../controllers/customerContractController');

// GET /api/customer-contracts - Get all customer contracts (list)
router.get('/', customerContractController.getCustomerContracts);

// GET /api/customer-contracts/:id - Get single customer contract (details)
router.get('/:id', customerContractController.getCustomerContract);

// POST /api/customer-contracts - Create new customer contract
router.post('/', customerContractController.createCustomerContract);

// PUT /api/customer-contracts/:id - Update customer contract
router.put('/:id', customerContractController.updateCustomerContract);

// DELETE /api/customer-contracts/:id - Delete customer contract
router.delete('/:id', customerContractController.deleteCustomerContract);

// POST /api/customer-contracts/:id/send-email - Send contract signature email
router.post('/:id/send-email', customerContractController.sendContractEmail);

// GET /api/customer-contracts/test/email-config - Test email configuration
router.get('/test/email-config', customerContractController.testEmailConfig);

module.exports = router; 
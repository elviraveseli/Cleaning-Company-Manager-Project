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

// Test send email
router.post('/test/send-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }
    
    const emailService = require('../services/emailService');
    const result = await emailService.sendTestEmail(email);
    
    res.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/:id/mark-paid', invoiceController.markAsPaid); // Mark as paid via email link

// Protected routes (require authentication)
router.use(authenticateToken);

// GET /api/invoices - Get all invoices (list)
router.get('/', invoiceController.getInvoices);

// GET /api/invoices/stats - Get invoice stats
router.get('/stats', invoiceController.getInvoiceStats);

// GET /api/invoices/generate-number - Generate a new invoice number
router.get('/generate-number', invoiceController.generateInvoiceNumber);

// GET /api/invoices/customer/:customerId - Get invoices by customer
router.get('/customer/:customerId', invoiceController.getInvoicesByCustomer);

// GET /api/invoices/contract/:contractId - Get invoices by contract
router.get('/contract/:contractId', invoiceController.getInvoicesByContract);

// POST /api/invoices - Create new invoice
router.post('/', invoiceController.createInvoice);

// GET /api/invoices/:id - Get single invoice
router.get('/:id', invoiceController.getInvoiceById);

// GET /api/invoices/:id/pdf - Generate invoice PDF
router.get('/:id/pdf', invoiceController.generateInvoicePDF);

// POST /api/invoices/:id/send-email - Send an invoice email
router.post('/:id/send-email', invoiceController.sendInvoiceEmail);

// POST /api/invoices/:id/verify-payment - Verify payment token
router.post('/:id/verify-payment', invoiceController.verifyPaymentToken);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', invoiceController.updateInvoice);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router; 
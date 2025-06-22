const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/invoices - Get all invoices (list)
router.get('/', invoiceController.getInvoices);

// GET /api/invoices/stats - Get invoice stats
router.get('/stats', invoiceController.getInvoiceStats);

// GET /api/invoices/generate-number - Generate a new invoice number
router.get('/generate-number', invoiceController.generateInvoiceNumber);

// GET /api/invoices/:id - Get single invoice (details)
router.get('/:id', invoiceController.getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/', invoiceController.createInvoice);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', invoiceController.updateInvoice);

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', invoiceController.deleteInvoice);

// POST /api/invoices/:id/mark-paid - Mark an invoice as paid
router.post('/:id/mark-paid', invoiceController.markAsPaid);

// POST /api/invoices/:id/send-email - Send an invoice email
router.post('/:id/send-email', invoiceController.sendInvoiceEmail);

// GET /api/invoices/customer/:customerId - Get invoices by customer
router.get('/customer/:customerId', invoiceController.getInvoicesByCustomer);

// GET /api/invoices/contract/:contractId - Get invoices by contract
router.get('/contract/:contractId', invoiceController.getInvoicesByContract);

module.exports = router; 
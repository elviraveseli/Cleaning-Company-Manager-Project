const express = require('express');
const router = express.Router();
const objectController = require('../controllers/objectController');

// GET /api/objects - Get all objects (list)
router.get('/', objectController.getObjects);

// GET /api/objects/:id - Get single object (details)
router.get('/:id', objectController.getObject);

// POST /api/objects - Create new object
router.post('/', objectController.createObject);

// PUT /api/objects/:id - Update object
router.put('/:id', objectController.updateObject);

// DELETE /api/objects/:id - Delete object
router.delete('/:id', objectController.deleteObject);

module.exports = router; 
const express = require('express');
const productController = require('../controllers/productController');
const compareController = require('../controllers/compareController');

const router = express.Router();

// GET /api/products/compare?q=... — Compare products across retailers
router.get('/compare', compareController.compare);

// GET /api/products/deal?url=... — Get best deal for a specific URL
router.get('/deal', compareController.deal);

// GET /api/products/search?q=... — Search products
router.get('/search', productController.search);

// GET /api/products — List all products
router.get('/', productController.getAll);

// GET /api/products/:id — Get single product
router.get('/:id', productController.getById);

// POST /api/products — Create a product (used by extension)
router.post('/', productController.create);

// PATCH /api/products/:id/track — Toggle tracking
router.patch('/:id/track', productController.toggleTracking);

module.exports = router;

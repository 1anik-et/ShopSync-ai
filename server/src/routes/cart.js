const express = require('express');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.get('/', cartController.getAll);
router.post('/', cartController.addItem);
router.patch('/:id', cartController.updateQuantity);
router.delete('/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;

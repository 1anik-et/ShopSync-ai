const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  retailer: {
    type: String,
    required: true // 'Amazon', 'Flipkart', 'Myntra', etc.
  },
  totalAmount: {
    type: Number,
    required: true
  },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    productUrl: String
  }],
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Tracked', 'Delivered'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

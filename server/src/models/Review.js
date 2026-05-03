const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // populated for internal users
  },
  userName: {
    type: String // populated for external scraped reviews
  },
  productId: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['ShopSync', 'Amazon', 'Flipkart', 'Myntra']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  replies: [{
    userName: String,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Unknown',
    },
    brand: {
      type: String,
      default: 'Generic',
    },
    availableSizes: [{
      type: String,
    }],
    retailer: {
      type: String,
      required: true,
    },
    retailerMeta: {
      color: { type: String, default: '#000' },
      logo: { type: String, default: '🛒' },
      trustScore: { type: Number, default: 4.0 },
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    deliveryDays: {
      type: Number,
      default: 3,
    },
    deliveryText: {
      type: String,
      default: '3 days',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    productUrl: {
      type: String,
      required: true,
    },
    searchQuery: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 2 * 24 * 60 * 60 * 1000), // Cache for 2 days
      index: { expires: '2d' },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', searchQuery: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

const mongoose = require('mongoose');

const shippingAddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    zip: {
      type: String,
      required: [true, 'ZIP code is required'],
    },
    country: {
      type: String,
      default: 'India',
    },
    addressType: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    label: String,
  },
  {
    timestamps: true,
  }
);

shippingAddressSchema.index({ user: 1 });
shippingAddressSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model('ShippingAddress', shippingAddressSchema);

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // Optional
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  barber: { type: mongoose.Schema.Types.ObjectId, ref: "Barber" },
  text: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Guest bookings allowed
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, match: [/^\d{10,15}$/, "Invalid phone number"] },
  bookingTime: { type: Date, required: true },
  rescheduledTime: { type: Date, default: null },
  service: { type: String, required: true }, // ✅ Store service name directly
  price: { type: Number, required: true, min: 0 }, // ✅ Store price at booking time
  barber: { type: mongoose.Schema.Types.ObjectId, ref: "Barber", required: true },
  area: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Canceled", "Rescheduled"], default: "Pending" },
  completedAt: { type: Date, default: null },
  paymentReceived: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ["online", "offline"], default: "offline" }
}, { timestamps: true });

bookingSchema.index({ bookingTime: 1, barber: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

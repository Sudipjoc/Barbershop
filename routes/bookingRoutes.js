const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Booking = require("../models/Booking");
const Barber = require("../models/Barber");
const auth = require("../middleware/auth");

// ✅ Create a new Booking (User)
router.post("/", auth, async (req, res) => {
  try {
    const { name, phone, bookingTime, service, price, area, barberId } = req.body;

    if (!name || !phone || !bookingTime || !service || !price || !area || !barberId) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const barber = await Barber.findById(barberId);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    const booking = new Booking({
      user: req.user.id,
      name,
      phone,
      bookingTime,
      service,
      price,
      area,
      barber: barberId
    });

    await booking.save();
    res.status(201).json({ msg: "Booking created successfully", booking });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get logged-in user's bookings
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("barber", "name location")
      .sort({ bookingTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Fetching My Bookings Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get all bookings (Admin / Barber)
router.get("/bookings", auth, async (req, res) => {
  try {
    const query = req.user.role === "barber" ? { barber: req.user.id } : {};

    const bookings = await Booking.find(query)
      .populate("user", "username")
      .populate("barber", "name")
      .sort({ bookingTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Fetching All Bookings Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Update booking status (Confirm, Complete, Cancel)
router.put("/:id/status", auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Completed", "Canceled", "Rescheduled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status." });
    }

    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    res.json({ msg: `Status updated to ${status}`, booking });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Update booking time (Reschedule)
router.put("/:id/time", auth, async (req, res) => {
  const { id } = req.params;
  const { newTime } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    booking.bookingTime = newTime;
    booking.status = "Rescheduled";
    await booking.save();

    res.json({ msg: "Booking rescheduled successfully", booking });
  } catch (error) {
    console.error("Rescheduling Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get single booking detail
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const booking = await Booking.findById(id)
      .populate("user", "username")
      .populate("barber", "name");

    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    res.json(booking);
  } catch (error) {
    console.error("Fetch Single Booking Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Delete a booking
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    res.json({ msg: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

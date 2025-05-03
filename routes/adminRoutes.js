// adminRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");
const Barber = require("../models/Barber");
const Booking = require("../models/Booking");

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const validTypes = ["image/png", "image/jpg", "image/jpeg"];
    validTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

// Admin Dashboard Welcome
router.get("/dashboard", auth, adminAuth, (req, res) => {
  res.json({ msg: "Welcome to Admin Panel!" });
});

// Get Total Revenue
router.get("/revenue", auth, adminAuth, async (req, res) => {
  try {
    const completedBookings = await Booking.find({ status: "Completed" });
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    res.json({ totalRevenue });
  } catch (error) {
    console.error("Revenue Fetch Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get All Users (excluding passwords)
router.get("/users", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get All Barbers (excluding passwords)
router.get("/barbers", auth, adminAuth, async (req, res) => {
  try {
    const barbers = await Barber.find({}, { password: 0 });
    res.json(barbers);
  } catch (error) {
    console.error("Fetch Barbers Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Create a Barber (by Admin manually with image upload)
router.post("/create-barber", auth, adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!image) {
      return res.status(400).json({ msg: "Image is required" });
    }

    const existingBarber = await Barber.findOne({ email });
    if (existingBarber) return res.status(400).json({ msg: "Barber already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newBarber = new Barber({
      name,
      email,
      password: hashedPassword,
      location,
      image
    });

    await newBarber.save();
    res.status(201).json({ msg: "Barber created successfully!", barber: newBarber });
  } catch (error) {
    console.error("Create Barber Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});



// Delete a Barber
router.delete("/delete-barber/:id", auth, adminAuth, async (req, res) => {
  try {
    await Barber.findByIdAndDelete(req.params.id);
    res.json({ msg: "Barber deleted successfully" });
  } catch (error) {
    console.error("Delete Barber Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete a User
router.delete("/delete-user/:id", auth, adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get System Stats (total users, barbers, appointments)
router.get("/stats", auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBarbers = await Barber.countDocuments();
    const totalAppointments = await Booking.countDocuments();

    res.json({ totalUsers, totalBarbers, totalAppointments });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

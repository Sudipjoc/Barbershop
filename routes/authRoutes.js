const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Barber = require("../models/Barber");
const router = express.Router();

// ✅ User or Barber Signup
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email }) || await Barber.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "barber") {
      // Barber signup
      const barber = new Barber({
        name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        location: req.body.location || "Not set",
        image: req.body.image || "default.jpg"
      });

      await barber.save();

      const token = jwt.sign({ id: barber._id, role: "barber" }, process.env.JWT_SECRET, { expiresIn: "1h" });

      return res.status(201).json({ token, barber });
    } else {
      // User signup (default role)
      const user = new User({
        firstName,
        lastName,
        username: `${firstName}${lastName}`.toLowerCase(),
        email,
        password: hashedPassword,
        role: role || "user"
      });

      await user.save();

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

      return res.status(201).json({ token, user });
    }
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Login (User or Barber)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await Barber.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get Logged In User Info
const auth = require("../middleware/auth");
router.get("/me", auth, async (req, res) => {
  try {
    const { id, role } = req.user;
    let user;

    if (role === "barber") {
      user = await Barber.findById(id).select("-password");
    } else {
      user = await User.findById(id).select("-password");
    }

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

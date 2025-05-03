const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Barber = require("../models/Barber");

module.exports = async function (req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // includes id and role

    // Optionally attach user/barber info
    if (decoded.role === "barber") {
      req.barber = await Barber.findById(decoded.id).select("-password");
    } else {
      req.userDetails = await User.findById(decoded.id).select("-password");
    }

    next();
  } catch (err) {
    console.error("Invalid token:", err);
    res.status(401).json({ message: "Token is not valid" });
  }
};

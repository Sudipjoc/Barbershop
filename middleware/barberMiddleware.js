const jwt = require("jsonwebtoken");
const Barber = require("../models/BarberModel");

module.exports = async function (req, res, next) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ msg: "Access Denied: No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // id and role

    const barber = await Barber.findById(req.user.id);
    if (!barber || req.user.role !== "barber") {
      return res.status(403).json({ msg: "Access Denied: Barbers Only" });
    }

    next();
  } catch (error) {
    console.error("Barber Auth Error:", error.message);
    res.status(401).json({ msg: "Invalid or Expired Token" });
  }
};

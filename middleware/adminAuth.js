const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ msg: "Access Denied: No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // id and role

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "Access Denied: Admins Only" });
    }

    next();
  } catch (error) {
    console.error("Admin Auth Error:", error.message);
    res.status(401).json({ msg: "Invalid or Expired Token" });
  }
};

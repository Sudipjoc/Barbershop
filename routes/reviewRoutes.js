const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Review = require("../models/Review");
const User = require("../models/User");

// ✅ Post a Review for a Barber
router.post("/", auth, async (req, res) => {
  try {
    const { bookingId, barberId, reviewText, rating } = req.body;

    if (!reviewText || !rating || !barberId) {
      return res.status(400).json({ msg: "Review text, rating and barber are required." });
    }

    const newReview = new Review({
      booking: bookingId || null,
      user: req.user.id,
      barber: barberId,
      text: reviewText,
      rating
    });

    await newReview.save();
    res.status(201).json({ msg: "Review submitted successfully", review: newReview });
  } catch (error) {
    console.error("Submit Review Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get Reviews by BarberId (or by BookingId)
router.get("/", async (req, res) => {
  try {
    const { barberId, bookingId } = req.query;

    const filter = {};
    if (barberId) filter.barber = barberId;
    if (bookingId) filter.booking = bookingId;

    const reviews = await Review.find(filter)
      .populate("user", "username")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Fetch Reviews Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Add Comment to a Review
router.post("/comments", auth, async (req, res) => {
  try {
    const { reviewId, commentText } = req.body;

    if (!commentText || !reviewId) {
      return res.status(400).json({ msg: "Comment text and review ID required." });
    }

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ msg: "Review not found." });

    review.comments.push({ user: req.user.id, text: commentText });
    await review.save();

    res.json({ msg: "Comment added!", review });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get Reviews Posted by a User
router.get("/user", auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate("barber", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Fetch User Reviews Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

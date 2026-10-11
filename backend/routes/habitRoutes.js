
const express = require("express");
const mongoose = require("mongoose");
const Habit = require("../models/Habit");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// All habit endpoints require a valid login cookie.
router.use(requireAuth);

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function todayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// GET: Retrieve only the logged-in user's habits.
router.get("/", async (req, res) => {
  try {
    const habits = await Habit.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    res.json(habits);
  } catch (error) {
    console.error("Fetch habits error:", error.message);
    res.status(500).json({ message: "Unable to retrieve habits." });
  }
});

// POST: Create a habit for the logged-in user.
router.post("/", async (req, res) => {
  try {
    const { name, category, frequency } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Please enter a habit name.",
      });
    }

    if (name.trim().length > 80) {
      return res.status(400).json({
        message: "Habit name cannot exceed 80 characters.",
      });
    }

    const allowedCategories = [
      "Health",
      "Learning",
      "Fitness",
      "Mindfulness",
      "Other",
    ];

    if (
      category !== undefined &&
      !allowedCategories.includes(category)
    ) {
      return res.status(400).json({
        message: "Invalid habit category.",
      });
    }

    if (
      frequency !== undefined &&
      !["Daily", "Weekly"].includes(frequency)
    ) {
      return res.status(400).json({
        message: "Invalid habit frequency.",
      });
    }

    const habit = await Habit.create({
      user: req.userId,
      name: name.trim(),
      category: category || "Other",
      frequency: frequency || "Daily",
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error("Create habit error:", error.message);
    res.status(500).json({ message: "Unable to create habit." });
  }
});

// PATCH: Toggle today's completion.
// The habit must belong to the logged-in user.
router.patch("/:id/toggle", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid habit ID.",
      });
    }

    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found.",
      });
    }

    const today = todayDate();
    const alreadyCompleted = habit.completionDates.includes(today);

    if (alreadyCompleted) {
      habit.completionDates = habit.completionDates.filter(
        (date) => date !== today
      );
    } else {
      habit.completionDates.push(today);
    }

    await habit.save();

    res.json(habit);
  } catch (error) {
    console.error("Toggle habit error:", error.message);
    res.status(500).json({ message: "Unable to update habit." });
  }
});

// PUT: Update a habit owned by the logged-in user.
router.put("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid habit ID.",
      });
    }

    const updates = {};
    const { name, category, frequency } = req.body;

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 80
      ) {
        return res.status(400).json({
          message: "Habit name must contain 1–80 characters.",
        });
      }

      updates.name = name.trim();
    }

    if (category !== undefined) {
      if (
        ![
          "Health",
          "Learning",
          "Fitness",
          "Mindfulness",
          "Other",
        ].includes(category)
      ) {
        return res.status(400).json({
          message: "Invalid habit category.",
        });
      }

      updates.category = category;
    }

    if (frequency !== undefined) {
      if (!["Daily", "Weekly"].includes(frequency)) {
        return res.status(400).json({
          message: "Invalid habit frequency.",
        });
      }

      updates.frequency = frequency;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided to update.",
      });
    }

    const habit = await Habit.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found.",
      });
    }

    res.json(habit);
  } catch (error) {
    console.error("Update habit error:", error.message);
    res.status(500).json({ message: "Unable to update habit." });
  }
});

// DELETE: Delete only a habit owned by the logged-in user.
router.delete("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid habit ID.",
      });
    }

    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!habit) {
      return res.status(404).json({
        message: "Habit not found.",
      });
    }

    res.json({
      message: "Habit deleted successfully.",
    });
  } catch (error) {
    console.error("Delete habit error:", error.message);
    res.status(500).json({ message: "Unable to delete habit." });
  }
});

module.exports = router;

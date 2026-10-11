
const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    category: {
      type: String,
      enum: [
        "Health",
        "Learning",
        "Fitness",
        "Mindfulness",
        "Other",
      ],
      default: "Other",
    },

    frequency: {
      type: String,
      enum: ["Daily", "Weekly"],
      default: "Daily",
    },

    completionDates: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Habit", habitSchema);

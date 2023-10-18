const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
      trim: true,
      maxLength: [30, "Your name can not exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      trim: true,
      minLength: [6, "Your password must be longer than 6 characters"],
      select: false, // ! this will not show the password in the response
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    avatar: {
      type: String,
      default: `https://ui-avatars.com/api/?name=Default&background=random`,
    },
    resetPasswordToken: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

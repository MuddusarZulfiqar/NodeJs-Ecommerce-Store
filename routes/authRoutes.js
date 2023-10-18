const express = require("express");
const router = express.Router();
const { authenticated, requiredRole } = require("../middlewares/auth");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", authenticated, logoutUser);

router.get("/refresh-token", authenticated, refreshToken);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/update-password", authenticated, updatePassword);

module.exports = router;

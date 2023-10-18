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
  updateProfile,
  updateRole,
  getAllUsers,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", authenticated, logoutUser);

router.get("/me", authenticated, getUserProfile);
router.get("/refresh-token", authenticated, refreshToken);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/update-password", authenticated, updatePassword);

router.post("/update-profile", authenticated, updateProfile);
router.post("/update-role", authenticated, requiredRole("admin"), updateRole);

router.get("/get-all-users", authenticated, requiredRole("admin"), getAllUsers);
module.exports = router;

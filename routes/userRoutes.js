const express = require("express");
const router = express.Router();
const { authenticated, requiredRole } = require("../middlewares/auth");
const {
  updateProfile,
  updateRole,
  getAllUsers,
  getUserProfile,
  getUserOrders,
} = require("../controllers/userController");

router.get("/me", authenticated, getUserProfile);
router.post("/update-profile", authenticated, updateProfile);
router.post("/update-role", authenticated, requiredRole("admin"), updateRole);

router.get("/get-all-users", authenticated, requiredRole("admin"), getAllUsers);
router.get("/get-user-orders", authenticated, getUserOrders);

module.exports = router;

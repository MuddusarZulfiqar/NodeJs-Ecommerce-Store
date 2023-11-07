const express = require("express");
const router = express.Router();
const {
  createOrder,
  stripeWebhook,
  getAllOrders,
  getAllOrdersByUser,
  getSingleOrder,
  updateOrder,
} = require("../controllers/orderController");
const { authenticated, requiredRole } = require("../middlewares/auth");

router.post("/create", authenticated, createOrder);
router.get("/get-all", authenticated, requiredRole("admin"), getAllOrders);
router.get("/get/by-user", authenticated, getAllOrdersByUser);
router.get("/:id", authenticated, requiredRole("admin"), getSingleOrder);
router.patch("/:id", authenticated, requiredRole("admin"), updateOrder);
router.post("/stripe/webhook", stripeWebhook);
module.exports = router;

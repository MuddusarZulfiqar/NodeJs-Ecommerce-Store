const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const categoryRoutes = require("./categoryRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const userRoutes = require("./userRoutes");

router.use("/auth", authRoutes);
router.use("/category", categoryRoutes);
router.use("/product", productRoutes);
router.use("/order", orderRoutes);
router.use("/user", userRoutes);

module.exports = router;

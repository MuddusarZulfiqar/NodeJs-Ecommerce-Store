const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../config/multer");

const {
  newProduct,
  getAllProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/productController");
const { authenticated, requiredRole } = require("../middlewares/auth");

router.post(
  "/create",
  authenticated,
  requiredRole("admin"),
  uploadMiddleware("product").array("file"),
  newProduct
);

router.get("/get-all-products", getAllProducts);
router.get("/get-product/:slug", getProduct);

router.delete(
  "/delete-product/:slug",
  authenticated,
  requiredRole("admin"),
  deleteProduct
);

router.patch(
  "/update-product/:slug",
  authenticated,
  requiredRole("admin"),
  uploadMiddleware("product").array("file"),
  updateProduct
);

module.exports = router;

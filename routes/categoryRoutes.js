const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../config/multer");

const {
  newCategory,
  getAllCategories,
  getCategory,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");
const { authenticated, requiredRole } = require("../middlewares/auth");

router.post(
  "/create",
  authenticated,
  requiredRole("admin"),
  uploadMiddleware("category").single("file"),
  newCategory
);

router.get("/get-all-categories", getAllCategories);
router.get("/get-category/:slug", getCategory);

router.delete(
  "/delete-category/:slug",
  authenticated,
  requiredRole("admin"),
  deleteCategory
);

router.patch(
  "/update-category/:slug",
  authenticated,
  requiredRole("admin"),
  uploadMiddleware("category").single("file"),
  updateCategory
);

module.exports = router;

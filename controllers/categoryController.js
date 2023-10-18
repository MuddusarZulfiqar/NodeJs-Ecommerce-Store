const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandling");
const CategoryModel = require("../models/CategoryModel");
const { default: slugify } = require("slugify");

// ! Create new category => /api/v1/category/new
exports.newCategory = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Category']
        #swagger.summary = 'Add new category'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
      BearerAuth: []
    }]
        #swagger.parameters['newCategory'] = {
            in: 'body',
            description: 'Category information.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/category" }
        }
  */
  const { name, description } = req.body;

  if (!name || !description) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }
  let slugifyName = slugify(name, {
    lower: true,
    strict: true,
  });
  const isCategory = await CategoryModel.find({
    slug: slugifyName,
  });
  // ! Check if category already exists
  if (isCategory.length > 0) {
    return next(new ErrorHandler("Category already exists", 400));
  }
  let fileUrl = "";
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }
  fileUrl = req.file.path;
  // ! Create new category
  const category = await CategoryModel.create({
    name,
    description,
    image: fileUrl,
    slug: slugifyName,
  });

  // ! Return response
  res.status(201).json({
    success: true,
    message: "Category is created",
    data: {
      category,
    },
  });
});

// ! Get all categories => /api/v1/category/get-all-categories
exports.getAllCategories = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Category']
        #swagger.summary = 'Get all categories'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
  */
  const categories = await CategoryModel.find();

  res.status(200).json({
    success: true,
    message: "All categories are found",
    data: {
      categories,
    },
  });
});

// ! Get category by slug => /api/v1/category/get-category/:slug
exports.getCategory = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Category']
        #swagger.summary = 'Get category by slug'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.parameters['slug'] = {
            in: 'path',
            description: 'Category slug.',
            required: true,
            type: 'string'
        }
  */
  const category = await CategoryModel.findOne({ slug: req.params.slug })
    .populate("products")
    .select("-__v");

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Category is found",
    data: {
      category,
    },
  });
});

// ! Delete category => /api/v1/category/delete-category/:slug
exports.deleteCategory = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Category']
        #swagger.summary = 'Delete category'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
          BearerAuth: []
        }]
        #swagger.parameters['slug'] = {
            in: 'path',
            description: 'Category slug.',
            required: true,
            type: 'string'
        }
  */
  // Change this to delete the category from the products
  const category = await CategoryModel.findOne({ slug: req.params.slug });
  if (category.products.length > 0) {
    return next(
      new ErrorHandler(
        "Category cannot be deleted due to have some products",
        400
      )
    );
  }
  const categoryDel = await CategoryModel.findOneAndDelete({
    slug: req.params.slug,
  });

  if (!categoryDel) {
    return next(new ErrorHandler("Category not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Category is deleted",
  });
});

// ! Update category => /api/v1/category/update-category/:slug
exports.updateCategory = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Category']
        #swagger.summary = 'Update category'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
          BearerAuth: []
        }]
        #swagger.parameters['slug'] = {
            in: 'path',
            description: 'Category slug.',
            required: true,
            type: 'string'
        }
        #swagger.parameters['updateCategory'] = {
            in: 'body',
            description: 'Category information.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/category" }
        }
  */
  let { name, description } = req.body;
  if (!name || !description) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }
  let category = await CategoryModel.findOne({ slug: req.params.slug });

  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  let slugifyName = slugify(name, {
    lower: true,
    strict: true,
  });

  const isCategory = await CategoryModel.find({
    slug: slugifyName,
  });
  // ! Check if category already exists
  if (isCategory.length > 0) {
    return next(new ErrorHandler("Category already exists", 400));
  }

  let fileUrl = "";
  if (!req.file) {
    fileUrl = category.image;
  } else {
    fileUrl = req.file.path;
  }

  category = await CategoryModel.findOneAndUpdate(
    { slug: req.params.slug },
    {
      name: name,
      description: description,
      image: fileUrl,
      slug: slugifyName,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Category is updated",
    data: {
      category,
    },
  });
});

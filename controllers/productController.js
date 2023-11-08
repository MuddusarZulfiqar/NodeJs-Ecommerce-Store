const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandling");
const ProductModel = require("../models/ProductModel");
const { default: slugify } = require("slugify");
const CategoryModel = require("../models/CategoryModel");

// ! Create new product => /api/v1/product/new
exports.newProduct = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Product']
        #swagger.summary = 'Create new product'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
            BearerAuth: []
            }]
  */
  const { name, price, description, category, stock } = req.body;

  // Check for required fields
  if (!name || !price || !description || !category || !stock) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }

  // Ensure the product name is unique by slugifying it
  const slugifyName = slugify(name, { lower: true, strict: true });
  const existingProduct = await ProductModel.findOne({ slug: slugifyName });

  if (existingProduct) {
    return next(new ErrorHandler("Product already exists", 400));
  }

  // Check if the category exists
  const checkCategory = await CategoryModel.findById(category);

  if (!checkCategory) {
    return next(new ErrorHandler("Category not found", 404));
  }

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return next(new ErrorHandler("No file uploaded.", 400));
  }

  // Create new product
  const product = await ProductModel.create({
    name,
    price,
    description,
    category,
    stock,
    seller: req.user._id,
    images: req.files.map((file) => file.path),
    slug: slugifyName,
  });

  // Add the product to the category
  checkCategory.products.push(product._id);
  await checkCategory.save();

  // Return success response
  res.status(201).json({
    success: true,
    message: "Product is created",
    data: { product },
  });
});

// ! Get all product => /api/v1/product/get-all-product
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  /* 
          #swagger.tags = ['Product']
          #swagger.summary = 'Get all products'
          #swagger.consumes = ['application/json']
          #swagger.produces = ['application/json']
          #swagger.parameters['page'] = {
            in: 'query',
            description: 'The page number',
            required: false,
            type: 'integer',
          }
          #swagger.parameters['limit'] = {
            in: 'query',
            description: 'The limit of products per page',
            required: false,
            type: 'integer',
          }
          #swagger.parameters['name'] = {
            in: 'query',
            description: 'Search Product by name',
            required: false,
            type: 'string',
          }
          #swagger.parameters['minPrice'] = {
            in: 'query',
            description: 'Minimum price of product',
            required: false,
            type: 'integer',
          }
          #swagger.parameters['maxPrice'] = {
            in: 'query',
            description: 'Maximum price of product',
            required: false,
            type: 'integer',
          }
    */
  // Set default values for pagination and filters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const productName = req.query.name || "";
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
  const category = req.query.category || "";
  // Calculate the skip value for pagination
  const skip = (page - 1) * limit;

  // Build the query object
  const categoryObj = await CategoryModel.findOne({ slug: category });
  if (category && !categoryObj)
    return next(new ErrorHandler("No Product Found", 404));
  const query = {
    name: { $regex: productName, $options: "i" }, // Case-insensitive search by product name
    price: { $gte: minPrice, $lte: maxPrice }, // Price range filter
    category: categoryObj ? categoryObj._id : { $ne: null }, // Category filter
  };

  const count = await ProductModel.countDocuments(query);
  const totalPages = Math.ceil(count / limit);

  const products = await ProductModel.find(query)
    .populate("category", "slug -_id")
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    message: "All products are found",
    data: {
      products,
      page,
      totalPages,
      totalProducts: count,
    },
  });
});

// ! Get product by slug => /api/v1/product/get-category/:slug
exports.getProduct = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Product']
        #swagger.summary = 'Get product by slug'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.parameters['slug'] = {
            in: 'path',
            description: 'Product slug.',
            required: true,
            type: 'string'
        }
  */
  const product = await ProductModel.findOne({
    slug: req.params.slug,
  }).populate("category", "slug -_id");

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Product is found",
    data: {
      product,
    },
  });
});

// ! Delete product => /api/v1/product/delete-product/:slug
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Product']
        #swagger.summary = 'Delete product'
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

  const product = await ProductModel.findOneAndDelete({
    slug: req.params.slug,
  });

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // ! Remove product from category
  const category = await CategoryModel.findByIdAndUpdate(product.category, {
    $pull: { products: product._id },
  });
  await category.save();

  res.status(200).json({
    success: true,
    message: "Product is deleted",
  });
});

// ! Update product => /api/v1/product/update-product/:slug
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Product']
        #swagger.summary = 'Update product'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
          BearerAuth: []
        }]
        #swagger.parameters['slug'] = {
            in: 'path',
            description: 'Product slug.',
            required: true,
            type: 'string'
        }
        #swagger.parameters['updatedProduct'] = {
            in: 'body',
            description: 'Category information.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/product" }
        }
  */
  const { name, price, description, category, stock } = req.body;
  const product = await ProductModel.findOne({ slug: req.params.slug });
  //   const slugifyName = ;

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Check if the category exists
  if (category) {
    const categoryProduct = await CategoryModel.findById(category);
    if (!categoryProduct) {
      return next(new ErrorHandler("Category not found", 404));
    }
  }

  // Update product
  product.name = name || product.name;
  product.price = price || product.price;
  product.description = description || product.description;
  product.category = category || product.category;
  product.stock = stock || product.stock;
  product.slug = name
    ? slugify(name, {
        lower: true,
        strict: true,
      })
    : product.slug;
  await product.save();

  // Return success response
  res.status(200).json({
    success: true,
    message: "Product is updated",
    data: { product },
  });
});

const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandling");
const UserModel = require("../models/UserModel");
const Order = require("../models/OrderModel");

// ! Update Profile
const updateProfile = catchAsyncErrors(async (req, res, next) => {
  /* 
      #swagger.tags = ['User']
      #swagger.summary = 'Update Profile.'
      #swagger.consumes = ['application/json']
      #swagger.produces = ['application/json']
      #swagger.security = [{
      BearerAuth: []
    }]
    */
  const { name, email } = req.body;
  if (!name || !email) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  let userExists = await UserModel.findById(req.user._id);
  // ! Check if user exists
  if (!userExists) {
    return next(new ErrorHandler("User not found", 404));
  }
  // ! Update user
  userExists.name = name;
  userExists.email = email;
  // ! If user change name then update avatar
  if (req.body.name) {
    userExists.avatar = `https://ui-avatars.com/api/?name=${name.replace(
      " ",
      "+"
    )}&background=random`;
  }
  await userExists.save();

  // send response
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});

// ! Get User Profile
const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  /* 
      #swagger.tags = ['User']
      #swagger.summary = 'Get User Profile.'
      #swagger.consumes = ['application/json']
      #swagger.produces = ['application/json']
      #swagger.security = [{
      BearerAuth: []
    }]
    */
  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: {
      user: req.user,
    },
  });
});

// ! Update Role
const updateRole = catchAsyncErrors(async (req, res, next) => {
  /* 
      #swagger.tags = ['User']
      #swagger.summary = 'Update Role.'
      #swagger.consumes = ['application/json']
      #swagger.produces = ['application/json']
      #swagger.security = [{
      BearerAuth: []
    }]
    */
  const { role, email } = req.body;
  if (!role || !email) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  if (req.user.email === email) {
    return next(new ErrorHandler("You can not change your role", 400));
  }
  let userExists = await UserModel.findOne({ email });
  // ! Check if user exists
  if (!userExists) {
    return next(new ErrorHandler("User not found", 404));
  }
  // ! Update user
  userExists.role = role;
  await userExists.save();

  // send response
  res.status(200).json({
    success: true,
    message: "Role updated successfully",
  });
});

// ! Get All Users
const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  /*
      #swagger.tags = ['User']
      #swagger.summary = 'Get Users by email with Pagination.'
      #swagger.consumes = ['application/json']
      #swagger.produces = ['application/json']
      #swagger.security = [{
        BearerAuth: []
      }]
      #swagger.parameters['email'] = {
        in: 'query',
        description: 'The email of the user to search for',
        required: false,
        type: 'string',
      }
      #swagger.parameters['page'] = {
        in: 'query',
        description: 'The page number for pagination',
        required: false,
        type: 'integer',
      }
      #swagger.parameters['limit'] = {
        in: 'query',
        description: 'The limit of users per page',
        required: false,
        type: 'integer',
      }
     */
  const { email, page, limit } = req.query;

  // Define default values for page and limit
  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 10; // Adjust this limit to your preference.

  // Define a filter object to filter users by email (if provided)
  const filter = {};
  if (email) {
    filter.email = email;
  }

  // Query the database using Mongoose to fetch users based on the filter and apply pagination.
  const users = await UserModel.find(filter)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .select("-__v");

  // Count the total number of users matching the filter for pagination information.
  const totalUsers = await UserModel.countDocuments(filter);

  // Send the response with pagination information and user data.
  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalUsers,
      },
    },
  });
});

// ! Get User Orders
const getUserOrders = catchAsyncErrors(async (req, res) => {
  /*
      #swagger.tags = ['User']
      #swagger.summary = 'Get Users by email with Pagination.'
      #swagger.consumes = ['application/json']
      #swagger.produces = ['application/json']
      #swagger.security = [{
        BearerAuth: []
      }]
    */
  const userId = req.user._id;

  // ! get all orders
  const orders = await Order.find({
    user: userId,
  });

  // ! Send Response
  res.status(200).json({
    message: `${
      orders.length > 0 ? "Orders found successfully" : "No order found"
    }`,
    data: {
      orders,
    },
  });
});

module.exports = {
  updateProfile,
  updateRole,
  getAllUsers,
  getUserProfile,
  getUserOrders,
};

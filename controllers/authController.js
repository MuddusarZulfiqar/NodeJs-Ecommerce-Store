const { generatePassword, comparePassword } = require("../config/bcrypt");
const { generateToken, validateToken } = require("../config/jwt");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandling");
const UserModel = require("../models/UserModel");

// ! Register User
const registerUser = catchAsyncErrors(async (req, res, next) => {
  /* 
      #swagger.tags = ['Auth']
      #swagger.summary = 'Register User.'
      #swagger.consumes = ['application/json']
      #swagger.produces = ['application/json']
  */
  const { name, email, password, role = "user" } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  // ! Check if user already exists
  const userExists = await UserModel.findOne({ email });
  if (userExists) {
    return next(new ErrorHandler("User already exists", 400));
  }
  // ! Hashing password
  const hashPassword = await generatePassword(password);
  // ! Generate avatar
  const avatar = `https://ui-avatars.com/api/?name=${name.replace(
    " ",
    "+"
  )}&background=random`;
  // ! Create user
  await UserModel.create({
    name,
    email,
    avatar,
    role,
    password: hashPassword,
  });

  // send response
  res.status(201).json({
    success: true,
    message: "User created successfully",
  });
});

// ! Login User
const loginUser = catchAsyncErrors(async (req, res, next) => {
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Login User.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.security = [{
      BearerAuth: []
    }]
  */
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  // ! Check if user exists
  const userExists = await UserModel.findOne({ email }).select("+password");
  if (!userExists) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }
  // ! Compare password
  const isPasswordMatched = await comparePassword(
    password,
    userExists.password
  );

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  // ! Generate token
  const token = await generateToken(userExists._id);
  // send response
  res.cookie("token", token, {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      token,
    },
  });
});

// ! Logout User
const logoutUser = catchAsyncErrors(async (req, res, next) => {
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Logout User.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.security = [{
    BearerAuth: []
  }]
  */
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

// ! Refresh Token
const refreshToken = catchAsyncErrors(async (req, res, next) => {
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Refresh Token.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.security = [{
    BearerAuth: []
  }]
  */
  const token = req.cookies.token;

  try {
    const newToken = await generateToken(req.UserModel._id);
    res.cookie("token", newToken, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // * 1 day
      httpOnly: true,
    });
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    return next(new ErrorHandler("You are not authorized", 401));
  }
});

// ! Forgot Password
const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Forgot Password.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
  */
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  // ! Check if user exists
  const userExists = await UserModel.findOne({ email });
  if (!userExists) {
    return next(new ErrorHandler("User not found", 404));
  }
  // ! Generate token
  const token = await generateToken(userExists._id, "10m");

  // ! Create reset password url
  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${token}`;

  // ! Add reset password token to user
  userExists.resetPasswordToken = token;
  await userExists.save();
  // send response
  res.status(200).json({
    success: true,
    message: "Reset password url sent successfully",
    data: {
      resetUrl,
      token: token,
    },
  });
});

// ! Reset Password
const resetPassword = catchAsyncErrors(async (req, res, next) => {
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Reset Password.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.parameters['token'] = {
      in: 'query',
      description: 'The token of the user',
      required: true,
      type: 'string',
    }
  */

  const { password } = req.body;
  const token = req.params.token;
  if (!password) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  // ! Check user by token
  const decoded = await validateToken(token);
  if (!decoded) {
    return next(new ErrorHandler("Invalid token", 400));
  }
  // ! Check if user exists
  const userExists = await UserModel.findById(decoded.id).select("+password");
  if (!userExists) {
    return next(new ErrorHandler("User not found", 404));
  }

  // ! Check if token is valid
  if (token !== userExists.resetPasswordToken) {
    return next(new ErrorHandler("Invalid token", 400));
  }
  // ! Hashing password
  const hashPassword = await generatePassword(password);
  // ! Update password
  userExists.password = hashPassword;
  // ! Invalidate token after reset password
  userExists.resetPasswordToken = undefined;
  await userExists.save();

  // send response
  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

// ! Update Password
const updatePassword = catchAsyncErrors(async (req, res, next) => {
  /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Update Password.'
    #swagger.security = [{
    BearerAuth: []
  }]
  */
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new ErrorHandler("Please fill all the fields", 400));
  }
  let userExists = await UserModel.findById(req.UserModel._id).select(
    "+password"
  );
  // ! Compare password
  const isPasswordMatched = await comparePassword(
    currentPassword,
    userExists.password
  );

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }
  // ! Hashing password
  const hashPassword = await generatePassword(newPassword);
  // ! Update password
  userExists.password = hashPassword;
  await userExists.save();

  // send response
  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  updatePassword,
};

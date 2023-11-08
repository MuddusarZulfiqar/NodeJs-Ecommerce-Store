const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandling");
const OrderModel = require("../models/OrderModel");
const ProductModel = require("../models/ProductModel");
const dotenv = require("dotenv");
const PaymentSession = require("../models/PaymentSession");
dotenv.config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ! Create new order => /api/v1/order/create
exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Order']
        #swagger.summary = 'Create new order'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
            BearerAuth: []
            }]
        #swagger.parameters['newOrder'] = {
            in: 'body',
            description: 'Order information.',
            required: true,
            type: 'object',
            schema: { $ref: "#/definitions/order" }
        }
  */

  const { products, address, phone } = req.body;
  const userId = req.user._id;

  // ! Check validation
  if (!products || !address || !phone) {
    return next(new ErrorHandler("Please provide all fields", 400));
  }

  let allProducts = await ProductModel.find({
    _id: { $in: products.map((product) => product.product) },
  });
  //   console.log(allProducts);

  // ! Check if products exists
  if (allProducts.length !== products.length) {
    return next(new ErrorHandler("Invalid product found", 404));
  }

  // ! Calculate total price
  let total = 0;
  products.forEach((product) => {
    total +=
      allProducts.find((p) => p._id.toString() === product.product.toString())
        .price * product.quantity;
  });

  // ! Create Order
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/order/success`,
    cancel_url: `${process.env.FRONTEND_URL}/order/cancel`,
    customer_email: req.user.email,
    client_reference_id: userId,
    line_items: products.map((product) => {
      const foundProduct = allProducts.find(
        (p) => p._id.toString() === product.product.toString()
      );
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: foundProduct.name,
            images: [foundProduct.images[0]],
          },
          unit_amount: foundProduct.price,
        },
        quantity: product.quantity,
      };
    }),
  });
  // ! Create Order Session
  await PaymentSession.create({
    user: req.user._id,
    session: session.id,
    paymentId: session.payment_intent || "null",
    // Create an order ID here 6 digit random number
    orderId: Math.floor(100000 + Math.random() * 900000),
    total: session.amount_total,
    status: "pending",
    paymentStatus: session.payment_status,
    products: products,
    address: address,
    phone: phone,
  });

  // ! Session created
  res.json({
    success: true,
    message: "Checkout link send successfully",
    data: { url: session.url },
  });
});

async function handlePaymentSuccess(session) {
  // Update PaymentSession for a successful payment
  const paymentSession = await PaymentSession.findOneAndUpdate(
    { session: session.id },
    {
      status: "success",
      paymentStatus: "paid",
    },
    { new: true }
  );

  // Get All products and update their stock
  const allProducts = await ProductModel.find({
    _id: { $in: paymentSession.products.map((product) => product.product) },
  });
  allProducts.forEach(async (product) => {
    const foundProduct = paymentSession.products.find(
      (p) => p.product.toString() === product._id.toString()
    );
    product.stock -= foundProduct.quantity;
    await product.save();
  });
  // Create an order in your database here
  console.log({ paymentSession, session });
  const order = new OrderModel({
    user: paymentSession.user, // Use the user ID from the payment session
    products: paymentSession.products, // Use the products from the payment session
    // Add other order details as needed
    total: paymentSession.total,
    address: paymentSession.address || "null",
    phone: paymentSession.phone || "null",
    status: "accepted",
    orderId: paymentSession.orderId,
  });
  await order.save();
}

async function handlePaymentFailure(session) {
  // Update PaymentSession for a failed payment
  console.log(session);
  await PaymentSession.findOneAndUpdate(
    { session: session.id },
    {
      status: "failed",
      paymentStatus: "failed",
    },
    { new: true }
  );

  // Additional actions for a failed payment
  // Notify the user about the failed payment, handle retries, etc.
}
// ! Stripe webhook
exports.stripeWebhook = catchAsyncErrors(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Received Stripe event:", event.type);
  } catch (err) {
    console.log(err);
    return next(new ErrorHandler(err.message, 400));
  }

  // Handle specific Stripe events
  console.log(event.type);
  switch (event.type) {
    case "checkout.session.completed":
      handlePaymentSuccess(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      // Payment failed
      handlePaymentFailure(event.data.object);
      break;
    case "payment_intent.payment_failed":
      // Payment failed
      console.log("Payment failed", event.data.object);
      break;
    default:
    // Handle other events or ignore them
  }

  res.sendStatus(200);
});

// ! Get all orders => /api/v1/order/get-all

exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Order']
        #swagger.summary = 'Get all orders'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
            BearerAuth: []
            }]
            #swagger.parameters['status'] = {
            in: 'query',
            description: 'Status Order',
            required: false,
            type: 'string'
        }
  */

  // if user send status in query then filter by status else return all orders
  let { status } = req.query;
  let orders;
  if (status) {
    orders = await OrderModel.find({ status: status })
      .populate("user", "name email")
      .populate("products.product", "name price images -_id");
  } else {
    orders = await OrderModel.find({})
      .populate("user", "name email")
      .populate("products.product", "name price images -_id");
  }
  res.json({
    success: true,
    message:
      orders.length > 0 ? `Orders found successfully` : `No orders found`,
    data: orders,
  });
});

// ! Get all orders by user => /api/v1/order/get/by-user
exports.getAllOrdersByUser = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Order']
        #swagger.summary = 'Get all orders by user'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
            BearerAuth: []
            }]
  */

  const orders = await OrderModel.find({ user: req.user._id })
    .populate("user", "name email")
    .populate("products.product", "name price images -_id");
  res.json({
    success: true,
    message:
      orders.length > 0 ? `Orders found successfully` : `No orders found`,
    data: orders,
  });
});
// ! Get single order => /api/v1/order/:id

exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Order']
        #swagger.summary = 'Get single order'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
            BearerAuth: []
            }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Order ID.',
            required: true,
            type: 'string'
        }
  */

  const order = await OrderModel.findById(req.params.id)
    .populate("user", "name email")
    .populate("products.product", "name price -_id");
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  res.json({ success: true, message: "Order found successfully", data: order });
});

// ! Update order => /api/v1/order/:id

exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  /* 
        #swagger.tags = ['Order']
        #swagger.summary = 'Update order'
        #swagger.consumes = ['application/json']
        #swagger.produces = ['application/json']
        #swagger.security = [{
            BearerAuth: []
            }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'Order ID.',
            required: true,
            type: 'string'
        }
        #swagger.parameters['updateOrder'] = {
            in: 'body',
            description: 'Order information.',
            required: true,
            type: 'object',
            schema: {
                $status: "accepted"
            }
        }
  */
  let { status } = req.body;
  if (!status) {
    return next(new ErrorHandler("Please provide status", 400));
  }
  let order = await OrderModel.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  order = await OrderModel.findByIdAndUpdate(
    req.params.id,
    {
      status,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  )
    .populate("user", "name email")
    .populate("products.product", "name price -_id");
  res.json({
    success: true,
    message: "Order update successfully",
    data: order,
  });
});

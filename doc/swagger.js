/* Swagger configuration */
const options = {
  openapi: "OpenAPI 3", // Enable/Disable OpenAPI. By default is null
  language: "en-US", // Change response language. By default is 'en-US'
  disableLogs: false, // Enable/Disable logs. By default is false
  autoHeaders: false, // Enable/Disable automatic headers capture. By default is true
  autoQuery: false, // Enable/Disable automatic query capture. By default is true
  autoBody: false, // Enable/Disable automatic body capture. By default is true
};

// const config = require("../config/cloud");
const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    version: "1.0.0", // by default: '1.0.0'
    title: "Ecommerce API", // by default: 'REST API'
    description: "Ecommerce Store Management", // by default: ''
    contact: {
      name: "API Support",
      email: "muddusarzulfiqar@gmail.com",
    },
  },
  host: "nodejs-ecommerce-store-production.up.railway.app", // by default: 'localhost:3000'
  basePath: "/api/v1", // by default: '/'
  schemes: ["https"], // by default: ['http']
  consumes: ["application/json"], // by default: ['application/json']
  produces: ["application/json"], // by default: ['application/json']
  tags: [
    {
      name: "Auth",
      description: "Auth System", // Tag description
    },
    {
      name: "User",
      description: "User Management", // Tag description
    },
    {
      name: "Category",
      description: "Product Category", // Tag description
    },
    {
      name: "Product",
      description: "Product Management", // Tag description
    },
    {
      name: "Order",
      description: "Order Management", // Tag description
    },
  ],
  securityDefinitions: {
    BearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
    },
  }, // by default: empty object
  definitions: {
    user: {
      name: "muddusar",
      email: "muddusarzulfiqar@purelogics.net",
      password: "123456",
      role: "user",
    },
    // Add Category with formData
    category: {
      name: "Mobile",
      description: "Mobile Description",
      image: "mobile.jpg",
    },
    // Add Product with formData
    product: {
      name: "Mobile",
      price: 100,
      description: "Mobile Description",
      category: "60a7b1f1f3c8d70b6c3e9e9f",
      stock: 100,
      images: ["mobile.jpg"],
    },
    // Add Order with formData
    order: {
      products: [
        {
          product: "60a7b1f1f3c8d70b6c3e9e9f",
          quantity: 2,
        },
      ],
      address: "Gulberg",
      phone: "123456789",
    },
  }, // by default: empty object (Swagger 2.0)
};

const outputFile = "./doc/swagger.json";
const endpointsFiles = ["../routes/index.js"];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as: app.js, app.js, routes.js, ... */
swaggerAutogen(outputFile, endpointsFiles, doc);

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("../app.js"); // Your project's root file
});

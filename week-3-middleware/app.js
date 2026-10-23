const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const dogsRouter = require("./routes/dogs");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

// --- request ID middleware
app.use((req, res, next) => {
  // give this request a unique id
  req.requestId = randomUUID();
  // send the same id back to the client in a response header
  // everything below uses this id
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// --- logging middleware
app.use((req, res, next) => {
  // standard timestamp
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

// --- SECURITY HEADERS ---


// --- JSON parsing middleware
// creating the request body so POST can read the content
app.use(express.json());

// --- static file middleware
// getting the files from the specified folder
app.use(express.static(path.join(__dirname, "public")));

// --- CONTENT-TYPE VALIDATION

// --- dog routes
app.use("/", dogsRouter);// Do not remove this line

// --- 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", requestId: req.requestId });
});

// --- error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error", requestId: req.requestId });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

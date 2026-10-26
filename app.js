// Imports
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const timeRouter = require("./routes/timeRoutes");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");

// App & Middleware
const app = express();

// temporary in memory database
global.user_id = null;
global.users = [];
global.tasks = [];

// body parsing must come before routes
app.use(express.json());

// Routes
// Router must come after express.json() — middleware runs in order,
// express.json() must come before the routes so that erq.body exists in the controllers
app.use("/api", timeRouter);
app.get("/", (req, res) => {
    res.send("Hello, World!");
});
app.post("/testpost", (req, res) => {
    res.status(200).json({
        message: "POST route works",
    });
});

app.use("/api/users", userRoutes);//public routes
app.use("/api/tasks", authMiddleware, taskRouter);//protected routes

// not found error handling must be last
app.use(notFound);
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 3000;

const server = app.listen(port, (error) => {
    if(error) {
        if(error.code === "EADDRINUSE") {
            console.error(`Port ${port} is already in use.`);
        } else {
            console.error("Server startup error:", error);
        }
        process.exit(1);
        return;
    }
    console.log(`Server is listening on port ${port}...`);
});

// Shutdown (Task 9)
let isShuttingDown = false;

async function shutdown(code = 0) {
    if (isShuttingDown) return ;
    isShuttingDown = true;

    console.log("Shutting down gracefully...");

    try {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log("HTTP server closed.");
    } catch (err) {
        console.error("Error during shutdown:", err);
        code = 1;
    } finally {
        process.exit(code);
    }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// Exports
module.exports = { app, server };

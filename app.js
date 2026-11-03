// Imports
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const timeRouter = require("./routes/timeRoutes");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const pool = require("./db/pg-pool");

// App & Middleware
const app = express();

// logged-in user id
global.user_id = null;

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

// Health check route at GET /health
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");//just checking if there is anything returned
        res.json({ status: "ok", db: "connected" });//sending 200 if that was ok
    } catch (err) {
        res.status(500).json({ message: `db not connected, error: ${ err.message }` });
    }
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

        // Close all PostgreSQL connections after the HTTP server has stopped.
        await pool.end();
        console.lot("HTTP server closed.")
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

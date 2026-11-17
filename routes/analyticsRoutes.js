
// --- Analytics Routes ---
const express = require("express");
const router = express.Router(); // holding routes

// destructuring the functions out of the exported object
const {
    getUserAnalytics,
    getUsersWithStats,
    searchTasks,
} = require("../controllers/analyticsController");

// --- Paths relative to /api/analytics ---
router.get("/users/:id", getUserAnalytics);
router.get("/users", getUsersWithStats);
router.get("/tasks/search", searchTasks);

module.exports = router;


// --- Task Routes ---
const express = require("express");
const router = express.Router();// mini-app only holding routes

// destructuring the functions out of the exported object
const {
    create,
    index,
    show,
    update,
    deleteTask,
} = require("../controllers/taskController");

// --- Paths relative to /api/tasks ---
router.post("/", create);
router.get("/", index);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;



// --- Task Routes ---
const express = require("express");
const router = express.Router();// mini-app only holding routes

// destructuring the functions out of the exported object
const {
    create,
    bulkCreate,
    index,
    show,
    update,
    deleteTask,
} = require("../controllers/taskController");

// --- Paths relative to /api/tasks ---
router.post("/", create);
router.post("/bulk", bulkCreate);
router.get("/", index);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;


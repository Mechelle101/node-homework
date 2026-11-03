const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

// --- Task Controller ---
// create with ownership
exports.create = async (req, res) => {
    if (!req.body) req.body = {};

    // validate first
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if(error) return res.status(400).json({ message: error.message });

    const result = await pool.query(
        `INSERT INTO tasks (title, is_completed, user_id)
         VALUES ($1, $2, $3) RETURNING id, title, is_completed`,
        [value.title, value.isCompleted ?? false, global.user_id]
    );
    const task = result.rows[0];

    // getting the task row from the DB
    res.status(201).json(task);
};

exports.index = async (req, res) => {
    // getting only the users tasks
    const result = await pool.query(
        "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
        [global.user_id]
    );
    const userTasks = result.rows;


    // returns 404, no task for this user
    if(userTasks.length === 0) {
        return res.status(404).json({ message: "No task found for this user." });
    }

    res.status(200).json(userTasks);
};

exports.show = async (req, res) => {
    // route params arrive as strings, convert to a number
    const taskId = parseInt(req.params?.id);

    // not a valid number: 400
    if(!taskId) {
        return res.status(400).json({ message: "Task ID passed is not valid." });
    }

    // find the task id and logged in user
    const result = await pool.query(
        "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
        [taskId, global.user_id]
    );
    const task = result.rows[0];

    // not a match for this user: 404
    if(!task) {
        return res.status(404).json({ message: "That task was not found." });
    }

    res.status(200).json(task);
};

exports.update = async (req, res) => {
    // check Joi gets the obj
    if (!req.body) req.body = {};

    // validate the patch body
    const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false });
    if(error) return res.status(400).json({ message: error.message });

    // convert route params from string to num.
    const taskId = parseInt(req.params?.id);
    if(!taskId) {
        return res.status(400).json({ message: "The task ID was not valid." });
    }

    // get the field names
    let keys = Object.keys(value);
    keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);

    // turn each name into "column = $number"
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

    // id and user_id placeholder
    const idParm = `$${keys.length + 1}`;
    const userParm = `$${keys.length + 2}`;

    // run it. WHERE checks both the task id and owner
    const result = await pool.query(
        `UPDATE tasks SET ${setClauses}
         WHERE id = ${idParm} AND user_id = ${userParm}
         RETURNING id, title, is_completed`,
        [...Object.values(value), taskId, global.user_id]
    );
    const task = result.rows[0];
 
    if(!task) {
        return res.status(404).json({ message: "The task was not found." });
    }

    res.status(200).json(task);
};

exports.deleteTask = async (req, res) => {
    // convert route params from string to number
    const taskId = parseInt(req.params?.id);
    if(!taskId) {
        return res.status(400).json({ message: "The task ID was not valid." });
    }

    // delete only if the owner and id match
    const result = await pool.query(
        "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
        [taskId, global.user_id]
    );
    const task = result.rows[0];

    if(!task) {
        return res.status(404).json({ message: "Task was not found." });
    }

    // send back a copy of what was deleted
    res.status(200).json(task);

};

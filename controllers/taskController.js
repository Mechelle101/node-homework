const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// place holder functions
// --- Task ID Counter ---
// helper function to return next task id when called
const taskCounter = (() => {
    let lastTaskNumber = 0;
    return () => {
        lastTaskNumber += 1;
        return lastTaskNumber;
    };
})();

// --- Task Controller ---
// create with ownership
exports.create = async (req, res) => {
    if (!req.body) req.body = {};

    // validate first
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if(error) return res.status(400).json({ message: error.message });

    // building the task from the validated value, stamped with the owners email
    const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };

    global.tasks.push(newTask);

    // sending a copy without a userId
    const { userId, ...sanitizedTask } = newTask;
    res.status(201).json(sanitizedTask);
};

exports.index = async (req, res) => {
    // Keep only the tasks owned by the logged-in user
    const userTasks = global.tasks.filter(
        (task) => task.userId === global.user_id.email
    );

    // returns 404, no task for this user
    if(userTasks.length === 0) {
        return res.status(404).json({ message: "No task found for this user." });
    }
    // pulling out the userId and returning the rest into a new array
    const sanitizedTasks = userTasks.map((task) => {
        const { userId, ...sanitizedTask } = task;
        return sanitizedTask;
    });

    res.status(200).json(sanitizedTasks);
};

exports.show = async (req, res) => {
    res.status(501).json({ message: "show...not yet" });
};
exports.update = async (req, res) => {
    res.status(501).json({ message: "update...not yet" });
};
exports.deleteTask = async (req, res) => {
    res.status(501).json({ message: "deleteTask...not yet" });
};


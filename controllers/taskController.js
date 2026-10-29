const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

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
    // route params arrive as strings, convert to a number
    const taskId = parseInt(req.params?.id);

    // not a valid number: 400
    if(!taskId) {
        return res.status(400).json({ message: "Task ID passed is not valid." });
    }

    // find a task matching both the id and logged-in users email
    const task = global.tasks.find(
        (task) => task.id === taskId && task.userId === global.user_id.email
    );

    // not a match for this user: 404
    if(!task) {
        return res.status(404).json({ message: "That task was not found." });
    }

    // send a copy without userId
    const { userId, ...sanitizedTask } = task;
    res.status(200).json(sanitizedTask);
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

    // find task matching id and user email
    const task = global.tasks.find(
        (task) => task.id === taskId && task.userId === global.user_id.email
    );
    if(!task) {
        return res.status(404).json({ message: "The task was not found." });
    }

    // merge validated patch field into stored task
    Object.assign(task, value);

    // send a copy without the userId
    const { userId, ...sanitizedTask } = task;
    res.status(200).json(sanitizedTask);
};

exports.deleteTask = async (req, res) => {
    // convert route params from string to number
    const taskId = parseInt(req.params?.id);
    if(!taskId) {
        return res.status(400).json({ message: "The task ID was not valid." });
    }

    // find the position of the task matching id and user email
    const taskIndex = global.tasks.findIndex(
        (task) => task.id === taskId && task.userId === global.user_id.email
    );

    // findIndex return -1 when nothing matches: 404
    if(taskIndex === -1) {
        return res.status(404).json({ message: "That task was not found." });
    }

    // copy the task without userId before removing it
    const { userId, ...sanitizedTask } = global.tasks[taskIndex];

    // remove one item at that position
    global.tasks.splice(taskIndex, 1);

    // send back a copy of what was deleted
    res.status(200).json(sanitizedTask);

};

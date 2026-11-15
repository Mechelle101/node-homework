const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

// --- Task Controller ---
// create with ownership
exports.create = async (req, res, next) => {
    if (!req.body) req.body = {};

    // validate first
    const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
    if(error) return res.status(400).json({ message: error.message });

    let task = null;
    try{
        task = await prisma.task.create({ 
            data: { ...value, userId: global.user_id },
            select: { title: true, isCompleted: true, id: true }
        });
    } catch (err) {
        // P2003 = FK failed: no user exist with the the userId
        if(err.code === "P2003") {
            return res.status(400).json({ message: "Invalid reference - the user does not exist" });
        }
        return next(err);
    }
    // getting the task row from the DB
    res.status(201).json(task);
};

exports.index = async (req, res) => {
    // getting only the users tasks
    const userTasks = await prisma.task.findMany({
        where: {
            userId: global.user_id, //gets only the task for the user
        },
        select: { title: true, isCompleted: true, id: true }
    });

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
    const task = await prisma.task.findUnique({
        where: { id: taskId, userId: global.user_id },
        select: { title: true, isCompleted: true, id: true }
    });

    // not a match for this user: 404
    if(!task) {
        return res.status(404).json({ message: "That task was not found." });
    }

    res.status(200).json(task);
};

exports.update = async (req, res, next) => {
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

    // run it. WHERE checks both the task id and owner
    let task = null;
    try{
     task = await prisma.task.update({
        data: value,
        where: {
            id: taskId,
            userId: global.user_id,
        },
        select: { title: true, isCompleted: true, id: true }
     });
    } catch(err) {
        // P2025 = no record matched the where
        if(err.code === "P2025") {
            return res.status(404).json({ message: "The task was not found" });
        }
        return next(err); //pass other errors to the global error handler
    }

    res.status(200).json(task);
};

exports.deleteTask = async (req, res, next) => {
    // convert route params from string to number
    const taskId = parseInt(req.params?.id);
    if(!taskId) {
        return res.status(400).json({ message: "The task ID was not valid." });
    }

    // delete only if the owner and id match
    let task = null;
    try{ 
        task = await prisma.task.delete({
            where: { id: taskId, userId: global.user_id },
            select: { title: true, isCompleted: true, id: true }
        });
    } catch(err) {
        // P2025 - there is nothing to delete for this user
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Task was not found." });
        }
        return next(err);
    }

    // send back a copy of what was deleted
    res.status(200).json(task);

};

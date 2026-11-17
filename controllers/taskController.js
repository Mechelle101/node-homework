const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");
const { getPagination, buildPagination } = require("../utils/pagination");

// --- Index Helpers ---
// builds the where obj for the task list from the query string
const buildTaskWhere = (query, userId) => {
    // only the logged in users tasks
    const whereClause = { userId };

    // find: title contains the text...
    if(query.find) {
        whereClause.title = {
            contains: query.find,
            mode: "insensitive",
        };
    }

    // idCompleted: only true or false is allowed
    if(query.isCompleted !== undefined) {
        if(query.isCompleted !== "true" && query.isCompleted !== "false") {
            return { error: "isCompleted must be true or false." };
        }
        // turn the string "true"/"false" into a boolean
        whereClause.isCompleted = query.isCompleted === "true";
    }

    // priority: must be one of the three values
    if(query.priority !== undefined) {
        if(!["low", "medium", "high"].includes(query.priority)) {
            return { error: "priority must be low, medium, or high." };
        }
        whereClause.priority = query.priority;
    }

    // min_date / max_date - one created at obj holds both limits
    if(query.min_date || query.max_date) {
        whereClause.createdAt = {};

        if(query.min_date) {
            const minDate = new Date(query.min_date);
            if(isNaN(minDate.getTime())) {
                return { error: "min_date is not a valid date." };
            }
            whereClause.createdAt.gte = minDate;  //on or after
        }

        if(query.max_date) {
            const maxDate = new Date(query.max_date) ;
            if(isNaN(maxDate.getTime())) {
                return { error: "max_date is not a valid date." };
            }
            whereClause.createdAt.lte = maxDate; //on or before
        }
    }
    return { whereClause };
}

// builds the order by obj from the query string
const getOrderBy = (query) => {
    const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
    const sortBy = query.sortBy || "createdAt";
    const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

    if(validSortFields.includes(sortBy)) {
        return { [sortBy]: sortDirection };
    }
    return { createdAt: "desc" }; //the default fallback
};

// build the select obj
const buildTaskSelect = (query) => {
    // the full select - used when no fields are requested
    const defaultSelect = {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: { select: { name: true, email: true } },
    };

    if(!query.fields) return defaultSelect;

    // only these can be requested
    const allowedFields = ["title", "isCompleted", "priority", "createdAt", "User"];

    // "title, priority" → ["title", "priority"], dropping anything not allowed
    const requested = query.fields
        .split(",")
        .map((field) => field.trim())
        .filter((field) => allowedFields.includes(field));

    // nothing valid requested → fall back to the full select
    if(requested.length === 0) return defaultSelect;

    // id is always included, then each requested field
    const select = { id: true };
    for(const field of requested) {
        select[field] = defaultSelect[field];
    }
    return select;
};

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
            select: { id: true, title: true, isCompleted: true, priority: true, createdAt: true }
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

// POST /api/tasks/bulk creates several tasks in one batch
exports.bulkCreate = async (req, res, next) => {
    if(!req.body) req.body = {};
    const { tasks } = req.body;

    if(!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
            message: "Invalid request data. Expected an array of tasks."
        });
    }

    // validate tasks before inserting
    const validTasks = [];
    for(const task of tasks) {
        const { error, value } = taskSchema.validate(task);
        if(error) {
            return res.status(400).json({
                message: "Validation Failed",
                details: error.details,
            });
        }
        validTasks.push({
            title: value.title,
            isCompleted: value.isCompleted || false,
            priority: value.priority || "medium",
            userId: global.user_id
        });
    }

    try {
        const result = await prisma.task.createMany({
            data: validTasks,
            skipDuplicates: false,
        });

        res.status(201).json({
            message: "Bulk task creation successful",
            tasksCreated: result.count,
            totalRequested: validTasks.length
        });
    } catch(err) {
        return next(err);
    }
};


exports.index = async (req, res) => {
    // pagination - read page and limit from the query
    const paging = getPagination(req.query);
    if(paging.error) {
        return res.status(400).json({ message: paging.error });
    }
    const { page, limit, skip } = paging;

    // filters - build the where obj 
    const filters = buildTaskWhere(req.query, global.user_id);
    if(filters.error) {
        return res.status(400).json({ message: filters.error });
    }
    const { whereClause } = filters;
    
    // getting only the users tasks
    // runs the page and count query at the same time
    const [tasks, totalTasks] = await Promise.all([
        prisma.task.findMany({
            // whereClause already contains userId and filters
            where: whereClause,
            select: buildTaskSelect(req.query),
            // pagination and sorting
            skip: skip, //rows before the page
            take: limit, //rows on the page
            orderBy: getOrderBy(req.query), 
        }),
        prisma.task.count({ where: whereClause }),
    ]);

    // returns 404, no task for this user
    if(totalTasks === 0) {
        return res.status(404).json({ message: "No task found for this user." });
    }

    res.status(200).json({
        tasks,
        pagination: buildPagination(page, limit, totalTasks),
    });
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
        select: { 
            id: true, 
            title: true, 
            isCompleted: true, 
            priority: true, 
            createdAt: true,
            User: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
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
        select: { id: true, title: true, isCompleted: true, priority: true, createdAt: true }
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
            select: { id: true, title: true, isCompleted: true, priority: true, createdAt: true }
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

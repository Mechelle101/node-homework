
// --- Analytics Controller ---
const prisma = require("../db/prisma");
// pagination helpers
const { getPagination, buildPagination } = require("../utils/pagination");

// GET /api/analytics/users/:id - task stats
exports.getUserAnalytics = async (req, res) => {
    // validate the user id from the url
    const userId = parseInt(req.params?.id);

    if(isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    // 404 checks users exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });
    if(!user) {
        return res.status(404).json({ message: "User not found." });
    }

    // weekly progress, 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // independent queries, run at the same time
    const [taskStats, recentTasks, weeklyProgress] = await Promise.all([
        // count of completed / not completed
        prisma.task.groupBy({
            by: ["isCompleted"],
            where: { userId },
            _count: { id: true },
        }),

        // eager load ten newest tasks with the owners name
        prisma.task.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                userId: true,
                User: {
                    select: { name: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),

        // groupBy created tasks in the last 7 days
        prisma.task.groupBy({
            by: ["createdAt"],
            where: {
                userId,
                createdAt: { gte: oneWeekAgo },
            },
            _count: { id: true },
        }),
    ]);

    // sending the results
    res.status(200).json({ taskStats, recentTasks, weeklyProgress });
};

// GET /api/analytics/users getting all users with counts, pagination
exports.getUsersWithStats = async (req, res) => {
    // pagination helper
    const paging = getPagination(req.query);
    if(paging.error) {
        return res.status(400).json({ message: paging.error });
    }
    const { page, limit, skip } = paging;

    // users with up to 5 incomplete tasks and total
    const [usersRaw, totalUsers] = await Promise.all([
        prisma.user.findMany({
            include: {
                Task: {
                    where: { isCompleted: false },
                    select: { id: true },
                    take: 5,
                },
                _count: {
                    select: {
                        Task: true,
                    },
                },
            },
            skip: skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.count(),
    ]);

    // rebuild each user
    const users = usersRaw.map(user => ({
        id: user.id, 
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        _count: user._count,
        Task: user.Task,
    }));

    // pagination obj
    const pagination = buildPagination(page, limit, totalUsers);

    res.status(200).json({ users, pagination });
};

// GET/api/analytics/tasks/search
exports.searchTasks = async (req, res) => {
    // Validate search query >= 2 chars
    const searchQuery = req.query.q;
    if (!searchQuery || searchQuery.trim().length < 2) {
        return res.status(400).json({ 
            message: "Search query must be at least 2 characters long" 
        });
    }

    // limit: default 20, must be a whole number from 1 to 100
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: "limit must be a whole number from 1 to 100." });
    }

    // build the search patterns OUTSIDE the SQL, so they're sent as parameters
    const searchPattern = `%${searchQuery}%`;   // contains
    const exactMatch = searchQuery;             // exact (case-insensitive)
    const startsWith = `${searchQuery}%`;       // starts with

    // raw sql
    const searchResults = await prisma.$queryRaw`
        SELECT
            t.id,
            t.title,
            t.is_completed as "isCompleted",
            t.priority,
            t.created_at as "createdAt",
            t.user_id as "userId",
            u.name as "user_name"
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        WHERE t.title ILIKE ${searchPattern} 
            OR u.name ILIKE ${searchPattern}
        ORDER BY 
        CASE 
            WHEN t.title ILIKE ${exactMatch} THEN 1
            WHEN t.title ILIKE ${startsWith} THEN 2
            WHEN t.title ILIKE ${searchPattern} THEN 3
            ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    // results of the search term and how many come back
    res.status(200).json({
        results: searchResults,
        query: searchQuery,
        count: searchResults.length,
    });
};

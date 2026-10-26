
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

    const newTask = {
        id: taskCounter(),
        title: req.body.title,
        isCompleted: req.body.isCompleted ?? false,
        userId: global.usee_id.email,
    };

    global.tasks.push(newTask);

    const { userId, ...sanitizedTask } = newTask;
    res.status(201).json(sanitizedTask);
};

exports.index = async (req, res) => {
    res.status(501).json({ message: "index...not yet" });
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


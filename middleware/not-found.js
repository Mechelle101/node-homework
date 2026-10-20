
// not found middleware
// this runs only when no route matched the request
const notFound = (req, res) => {
    // status is 404/not found
    res.status(404).json({ message: `No route found for ${req.method} ${req.path}` });
};

// exports
module.exports = notFound;

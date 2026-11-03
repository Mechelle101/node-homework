
// error handler middleware
// runs when any route or middleware calls next(error)
// although next is not used it is needed for error handling
const errorHandler = (err, req, res, next) => {
    // database connection refused - usually means Postgres isn't running
    if (err.code === "ECONNREFUSED" && err.port === 5432) { // the postgresql port
        console.log("The database connection was refused.  Is your database service running?");
    }


    // full details will go to the server log, for devs
    console.error(err);

    // safe short message goes to the client, 500 is a server error
    res.status(500).json({ message: "Internal server error." });
};

// exports
module.exports = errorHandler;


const express = require("express");
const timeRouter = require("./routes/timeRoutes");
const app = express();

app.use(express.json());
// place this after because they are processed in order
// express.json() has the parse the body before the request reaches echoBody
app.use("/api", timeRouter);

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
    res.status(200).json({
        message: "POST route works",
    });
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };

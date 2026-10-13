
const express = require("express");
const timeController = require("../controllers/timeController");

const router = express.Router();
// this is handing express the function itself, 
// not calling the function like getTime()
router.get("/time", timeController.getTime);
router.post("/echo", timeController.echoBody);

module.exports = router;

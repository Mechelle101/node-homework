
// imports 
const express = require("express"); //needed for routers
// destructuring the functions needed
const { register, logon, logoff, show } = require("../controllers/userController");
// auth middleware, routes that need it
const jwtMiddleware = require("../middleware/jwtMiddleware");

// router setup
// a mini app holding only the needed routes
const router = express.Router();

// user routes
// when post request comes in for the specified route
// run the associated function (/route, function)
router.post("/register", register);
router.post("/logon", logon);
//this is post because it also changes state
router.post("/logoff", jwtMiddleware, logoff); 
// protected route, show when logged in (route level middleware)
router.get("/:id", jwtMiddleware, show);

// exports
module.exports = router;

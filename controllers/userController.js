const { userSchema } = require("../validation/userSchema");

// Register
// the register route handler (req: what the client sent, res: my reply)
const register = (req, res) => {

    // first validate, if theres not a request body...
    if(!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    if(error) return res.status(400).json({message: error.message});

    // destructuring the following... adding value.email, value.name, value.password. 
    const { name, email, password } = value;
    
    // reject email thats already registered, needs an email before it can check
    // needs to come before the user push, it would be too late to validate
    const existingUser = global.users.find((user) => user.email === email);
    if(existingUser) {
        return res.status(400).json({ message: "That email is already registered." });
    }

    // building the user obj...name is shorthand for name: name etc
    const newUser = { name, email, password };

    global.users.push(newUser);
    // Marking the user as logged in
    global.user_id = newUser;
    // responds with 201/created and including only name and email
    res.status(201).json({ name: newUser.name, email: newUser.email });
};

// Logon
const logon = (req, res) => {
    // make sure there is always a request body to read from
    if(!req.body) req.body = {};

    // gets the values the user typed to login
    const { email, password } = req.body;
    // Searches the array and returns the first user where the test is true
    const foundUser = global.users.find(
        (user) => user.email === email && user.password === password
    );
    // no match: 401/unauthorized and return to stop running
    if(!foundUser) {
        return res.status(401).json({ message: "Authentication failed." });
    }

    global.user_id = foundUser;
    // the status is 200/ok because it does not create anything new
    res.status(200).json({ name: foundUser.name, email: foundUser.email });
};

// Logoff
const logoff = (req, res) => {
    // sets the user to empty
    global.user_id = null;

    res.status(200).json({ message: "Logged off." });
};

module.exports = { register, logon, logoff };


// Register
// the register route handler (req: what the client sent, res: my reply)
const register = (req, res) => {
    // destructuring the following...
    const { name, email, password } = req.body;
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

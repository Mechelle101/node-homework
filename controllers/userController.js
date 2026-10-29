// Nodes builtin crypto tools
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const { userSchema } = require("../validation/userSchema");

// Password helpers
// creates random salt, hashes the password, returns "salt:hash"
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
}

// splits the stored "salt:hash", re-hashes the attempt with the same salt
async function comparePassword(inputPassword, storedHash) {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// register route handler (req: what the client sent, res: my reply)
// the function needs to be async to be able to use await, needed for PW hashing
const register = async (req, res) => {

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

    // hash the PW before storing anything
    const hashedPassword = await hashPassword(password);

    // building the user obj, using the hashed PW
    const newUser = { name, email, hashedPassword };

    global.users.push(newUser);
    // Marking the user as logged in
    global.user_id = newUser;
    // responds with 201/created and including only name and email
    res.status(201).json({ name: newUser.name, email: newUser.email });
};

// Logon - added async to be able to use await
const logon = async (req, res) => {
    // make sure there is always a request body to read from
    if(!req.body) req.body = {};
    // gets the values the user typed to login
    const { email, password } = req.body;

    // find the user by email only
    const foundUser = global.users.find((user) => user.email === email);

    // only compares if a user was found and a PW was sent
    const goodCredentials = 
        foundUser && password && (await comparePassword(password, foundUser.hashedPassword));

    // no match: 401/unauthorized and return to stop running
    if(!goodCredentials) {
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

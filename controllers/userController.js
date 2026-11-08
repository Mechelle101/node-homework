// Nodes builtin crypto tools
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");

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
const register = async (req, res, next) => {

    // first validate, if theres not a request body...
    if(!req.body) req.body = {};
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });

    if(error) return res.status(400).json({message: error.message});

    // destructuring the following... adding value.email, value.name, value.password. 
    const { name, email, password } = value;

    // hash the PW before storing anything
    const hashedPassword = await hashPassword(password);

    // save the user to the users table
    let result;
    try {
        result = await pool.query(
            `INSERT INTO users (email, name, hashed_password)
             VALUES ($1, $2, $3) RETURNING id, email, name`,
            [email, name, hashedPassword]
        );  
    } catch (e) {
        // 23505 = the UNIQUE rule was broken, so this email is already registered
        if (e.code === "23505") {
            return res.status(400).json({ message: "That email is already registered." });
        }
        // any other database error goes to the global error handler
        return next(e);
    }
    // new users row
    const newUser = result.rows[0];

    // Mark the user as logged in
    global.user_id = newUser.id;
    // 201 created response with name and email
    res.status(201).json({ name: newUser.name, email: newUser.email });
};

// Logon - added async to be able to use await
const logon = async (req, res) => {
    // make sure there is always a request body to read from
    if(!req.body) req.body = {};
    // gets the values the user typed to login
    const { email, password } = req.body;

    // find the user in the DB
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const foundUser = result.rows[0];
    
    // only compares if a user was found and a PW was sent
    const goodCredentials = 
        foundUser && password && (await comparePassword(password, foundUser.hashed_password));

    // no match: 401/unauthorized and return to stop running
    if(!goodCredentials) {
        return res.status(401).json({ message: "Authentication failed." });
    }
    // getting just the id number
    global.user_id = foundUser.id;
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

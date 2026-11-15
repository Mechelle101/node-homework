// Nodes builtin crypto tools
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

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
    let user = null;
    try {
        user = await prisma.user.create({
            data: { name, email, hashedPassword },
            select: { name: true, email: true, id: true }//only these fields come back
        });  
    } catch (err) {
        // P2002 = Prisma code for UNIQUE rule was broken
        if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
            return res.status(400).json({ message: "That email is already registered." });
        }
        // any other database error goes to the global error handler
        return next(err);
    }

    // Mark the user as logged in
    global.user_id = user.id;
    // 201 created response with name and email
    res.status(201).json({ name: user.name, email: user.email });
};

// Logon - added async to be able to use await
const logon = async (req, res) => {
    // make sure there is always a request body to read from
    if(!req.body) req.body = {};
    // gets the values the user typed to login
    let { email, password } = req.body;

    // auth failed if no email or PW found
    if(typeof email !== "string" || !password) {
        return res.status(401).json({ message: "Authentication failed." });
    }

    // convert to lowercase
    email = email.toLowerCase();

    // find the user in the DB
    const foundUser = await prisma.user.findUnique({ where: { email } });
    
    // only compares if a user was found and a PW was sent
    const goodCredentials = 
        foundUser && password && (await comparePassword(password, foundUser.hashedPassword));

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

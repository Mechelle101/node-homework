
module.exports = (req, res, next) => {
    if(!global.user_id) {
        return res.status(401).json({ message: "Unauthorize!" });
    }
    // Pass the request to the next function in line, if a user is logged in
    next();
};

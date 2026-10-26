
// --- User Validation Schema ---
const Joi = require("joi");

// these are the specifications for the users email, name, and password
const userSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    name: Joi.string().trim().min(3).max(30).required(),
    password: Joi.string()
    .trim()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
    .messages({
        "string.patter.base":
        "Password must be at least 8 characters long and include upper and lowercase letters, a number, and a special character.",
    }),
});

module.exports = { userSchema };

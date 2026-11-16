
// --- Task Validation Schema ---
const Joi = require("joi");

// Create: title required, isCompleted defaults to false
const taskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).required(),
    isCompleted: Joi.boolean().default(false).not(null),
    // only these three values are allowed, where medium is the default.
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
});

// Patch: partial updates allowed, at least one field required
const patchTaskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).not(null),
    isCompleted: Joi.boolean().not(null),
    // a patch will not reset priority
    priority: Joi.string().valid("low", "medium", "high"),
    // (1) at least 1 key must be present, with a singular error message
}).min(1).message("No attributes to change were specified.");

module.exports = { taskSchema, patchTaskSchema };

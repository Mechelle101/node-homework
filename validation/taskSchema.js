
// --- Task Validation Schema ---
const Joi = require("joi");

// Create: title required, isCompleted defaults to false
const taskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).required(),
    isCompleted: Joi.boolean().default(false).note(null),
});

// Patch: partial updates allowed, at least one field required
const patchTaskSchema = Joi.object({
    title: Joi.string().trim().min(3).max(30).not(null),
    isCompleted: Joi.boolean().note(null),
    // (1) at least 1 key must be present, with a singular error message
}).min(1).message("No attributes to change were specified.");

module.exports = { taskSchema, patchTaskSchema };

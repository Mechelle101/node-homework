
// --- Pagination Helper ---

// reads page and limit from req.query, defaults and validations
const getPagination = (query) => {

    const page = query.page === undefined ? 1 : Number(query.page);
    const limit = query.limit === undefined ? 10 : Number(query.limit);

    // page must be a whole number of 1 or higher
    if(!Number.isInteger(page) || page < 1) {
        return { error: "The page must be a whole number of 1 or greater" };
    }

    // limit must be a whole number of 1 to 100
    if(!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return { error: "The limit must be a whole number between 1 and 100." };
    }

    // skip is how many rows come before this page
    return { page, limit, skip: (page - 1) * limit };
};

// metadata object for page buttons
const buildPagination = (page, limit, total) => ({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit), //round up
    hasNext: page * limit < total,  //page 2
    hasPrev: page > 1,  //page 1
});

module.exports = { getPagination, buildPagination };

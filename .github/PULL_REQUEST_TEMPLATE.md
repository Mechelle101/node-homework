<!--- Provide a general summary of your code in the Title above -->

## Description

This PR completes the required part od week 3 (Assignments 3A and 3B).

**Assignment 3A – Main Todo Backend**
- `controllers/userController.js` – exports `register`, `logon`, and `logoff`.
  - `register` reads name, email, and password from `req.body`, adds the user to `global.users`, sets `global.user_id`, and returns 201 with only the name and email (the password is never sent back).
  - `logon` finds a user in `global.users` whose email and password both match. It returns 200 with the name and email, or 401 if there is no match.
  - `logoff` sets `global.user_id` to `null` and returns 200.
- `routes/userRoutes.js` – connects `POST /register`, `POST /logon`, and `POST /logoff` to the controller functions.
- `middleware/not-found.js` – returns a 404 JSON response for unmatched routes.
- `middleware/error-handler.js` – a four-parameter `(err, req, res, next)` error handler that logs the full error on the server and returns a safe 500 JSON message.
- `app.js` – initializes `global.user_id`, `global.users`, and `global.tasks`, and registers middleware in the required order: `express.json()` → routes → not-found → error-handler. The user router is mounted at `/api/users`. All Assignment 2 work (time routes, graceful shutdown) is still in place.

**Assignment 3B – Dog Rescue Middleware (`week-3-middleware/app.js`)**
- Request ID middleware – sets `req.requestId` with `crypto.randomUUID()` and adds an `X-Request-Id` response header.
- Logging middleware – logs each request as `[timestamp]: METHOD PATH (requestId)`.
- `express.json()` – parses request bodies so `POST /adopt` can read `req.body`.
- `express.static()` – serves files from `week-3-middleware/public`, so `GET /images/dachshund.png` returns the image.
- 404 handler – returns `{ "error": "Route not found", "requestId": "..." }`.
- Error handler – returns `{ "error": "Internal Server Error", "requestId": "..." }`.

**Other changes**
- Downgraded `uuid` to version 8xx as a dev dependency, per the class leader's instructions, so the Jest tests run correctly.

The optional dog middleware tasks (3C) are not included in this PR, although i do plan to revisit them later. 

## Context

This week adds middleware and error handling to the Express app. The user routes are the first step toward authentication, using global (global.xxx) variables as a temporary in-memory database until Prisma and PostgreSQL are added later in the course. The dog rescue app is a separate practice app for built-in and custom middleware, middleware order, and consistent JSON error responses that include a request ID for tracing.

## How has this been tested?

- `npm run tdd assignment3a` – 7 of 7 tests passing
- `npm run tdd assignment3b` – 12 of 12 tests passing
- Manually checked the dog rescue app in the browser by running `node week-3-middleware/app.js` and visiting `/dogs`, `/images/dachshund.png`, a nonexistent route, and `/error`
- Environment: macOS, Node.js, Jest, Supertest

## Screenshots (if appropriate):

<!--- A screenshot or screen recording of your changes -->

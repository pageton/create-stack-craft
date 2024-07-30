const { Hono } = require("hono");
const { serve } = require("@hono/node-server");
const routes = require("./routes");

const app = new Hono();
const port = 3000;

// Middleware
app.use("*", async (c, next) => {
    console.log(`[${c.req.method}] ${c.req.url}`);
    await next();
});

// Routes
app.route("/", routes);

console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port: port
});

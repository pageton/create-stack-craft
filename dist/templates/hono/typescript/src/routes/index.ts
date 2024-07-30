// @ts-ignore

import { Hono } from "hono";

const routes = new Hono();
// @ts-ignore

routes.get("/", (c) => {
    return c.json({ message: "Welcome to the API" });
});
// @ts-ignore

routes.get("/health", (c) => {
    return c.json({ status: "OK" });
});

export default routes;

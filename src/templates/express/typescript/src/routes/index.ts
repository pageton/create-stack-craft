import express, { Router, Request, Response } from "express";

const router: Router = express.Router();

router.get("/", (req: Request, res: Response) => {
    res.json({ message: "Welcome to the API" });
});

router.get("/health", (req: Request, res: Response) => {
    res.json({ status: "OK" });
});

export default router;

export interface ProjectOptions {
    name: string;
    language: "javascript" | "typescript";
    framework: "express" | "hono";
    usePrisma: boolean;
}

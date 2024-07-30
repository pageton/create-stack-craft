#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

const packageJsonPath = path.join(__dirname, "../package.json");
const { version } = fs.readJsonSync(packageJsonPath);

program
    .version(version)
    .description("A CLI tool to create projects with Express, Hono, and Prisma")
    .action(async () => {
        let validProjectName = false;
        let projectName = "";

        while (!validProjectName) {
            const answers = await inquirer.prompt([
                {
                    type: "input",
                    name: "projectName",
                    message: "Enter your project name:",
                    default: "my-project"
                }
            ]);

            projectName = answers.projectName;
            const targetPath = path.join(process.cwd(), projectName);

            if (fs.existsSync(targetPath)) {
                console.error(
                    chalk.red(
                        `The project name '${projectName}' already exists. Please enter a different name.`
                    )
                );
            } else {
                validProjectName = true;
            }
        }

        const { framework, language, usePrisma, runNpmInstall } =
            await inquirer.prompt([
                {
                    type: "list",
                    name: "framework",
                    message: "Choose the framework",
                    choices: ["Express", "Hono"]
                },
                {
                    type: "list",
                    name: "language",
                    message: "Choose the language",
                    choices: ["TypeScript", "JavaScript"]
                },
                {
                    type: "confirm",
                    name: "usePrisma",
                    message: "Do you want to include Prisma?",
                    default: false
                },
                {
                    type: "confirm",
                    name: "runNpmInstall",
                    message: "Do you want to run 'npm install' after setup?",
                    default: true
                }
            ]);

        const templatePath = path.join(
            __dirname,
            "templates",
            framework.toLowerCase(),
            language.toLowerCase()
        );
        const targetPath = path.join(process.cwd(), projectName);
        console.log(targetPath, templatePath);

        if (!fs.existsSync(templatePath)) {
            console.error(
                chalk.red(`Template path does not exist: ${templatePath}`)
            );
            process.exit(1);
        }

        try {
            fs.copySync(templatePath, targetPath);
        } catch (error) {
            console.error(chalk.red(`Error copying files: ${error.message}`));
            process.exit(1);
        }

        if (usePrisma) {
            const prismaTemplatePath = path.join(
                __dirname,
                "templates",
                "prisma"
            );

            if (!fs.existsSync(prismaTemplatePath)) {
                console.error(
                    chalk.red(
                        `Prisma template path does not exist: ${prismaTemplatePath}`
                    )
                );
                process.exit(1);
            }

            try {
                const prismaTargetPath = path.join(targetPath, "prisma");
                fs.ensureDirSync(prismaTargetPath);

                const prismaFiles = ["schema.prisma"];
                prismaFiles.forEach((file) => {
                    const prismaFilePath = path.join(prismaTemplatePath, file);
                    if (fs.existsSync(prismaFilePath)) {
                        fs.copySync(
                            prismaFilePath,
                            path.join(prismaTargetPath, file)
                        );
                    } else {
                        console.error(
                            chalk.red(
                                `${file} not found in ${prismaTemplatePath}.`
                            )
                        );
                    }
                });

                const envFiles = [".env", ".env.example"];
                envFiles.forEach((file) => {
                    const envFilePath = path.join(prismaTemplatePath, file);
                    if (fs.existsSync(envFilePath)) {
                        fs.copySync(envFilePath, path.join(targetPath, file));
                    } else {
                        console.error(
                            chalk.red(
                                `${file} not found in ${prismaTemplatePath}.`
                            )
                        );
                    }
                });
            } catch (error) {
                console.error(
                    chalk.red(`Error copying Prisma files: ${error.message}`)
                );
                process.exit(1);
            }

            const packageJsonPath = path.join(targetPath, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = fs.readJsonSync(packageJsonPath);

                    packageJson.dependencies = {
                        ...packageJson.dependencies,
                        prisma: "^5.16.2",
                        "@prisma/client": "^5.16.2",
                        dotenv: "^16.4.5"
                    };

                    packageJson.scripts = {
                        "db:generate": "prisma generate",
                        "db:migrate": "prisma migrate deploy",
                        "db:push": "prisma db push",
                        "db:studio": "prisma studio",
                        ...packageJson.scripts,
                        postinstall: "prisma generate"
                    };

                    fs.writeJsonSync(packageJsonPath, packageJson, {
                        spaces: 2
                    });
                } catch (error) {
                    console.error(
                        chalk.red(
                            `Error updating package.json: ${error.message}`
                        )
                    );
                    process.exit(1);
                }
            } else {
                console.error(
                    chalk.red(`package.json not found in ${targetPath}`)
                );
                process.exit(1);
            }
        }

        // Run npm install if selected
        if (runNpmInstall) {
            try {
                execSync("npm install", { stdio: "inherit", cwd: targetPath });
            } catch (error) {
                console.error(
                    chalk.red(`Error installing dependencies: ${error.message}`)
                );
                process.exit(1);
            }
        }

        console.log(
            chalk.yellowBright(
                `Project setup is complete. Your project is ready at ${targetPath}`
            )
        );
        console.log(
            chalk.yellowBright(`To get started, run the following commands:`)
        );
        console.log(chalk.blue(`'cd ${projectName}'`));
        if (!runNpmInstall) {
            console.log(chalk.blue(`'npm install'`));
        }
        console.log(chalk.blue(`'npm run dev'`));
    });

program.parse(process.argv);

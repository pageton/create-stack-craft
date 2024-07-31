# Create Stack Craft

**Create Stack Craft** is a CLI tool to create projects with Express, Hono, and Prisma. This tool helps you quickly set up a new project with the desired framework, language, and Prisma integration.

## Features

- Create projects with Express or Hono.
- Choose between TypeScript or JavaScript.
- Optionally include Prisma for database management.
- Automatically set up the project structure and dependencies.

## Installation

To use Create Stack Craft, you need to have Node.js and npm installed on your machine. You can install Create Stack Craft globally using [npm](https://www.npmjs.com/package/create-stack-craft):

```bash
npm install -g create-stack-craft
```

## Usage

You can create a new project by running the following command with `npm`:

```bash
npm create stack-craft@latest
```

Or with `pnpm`:

```bash
pnpm create stack-craft@latest
```

### Interactive Prompts

You will be prompted to enter the following information:

1. **Project Name**: Enter the name of your project.
2. **Framework**: Choose between Express or Hono.
3. **Language**: Choose between TypeScript or JavaScript.
4. **Include Prisma**: Optionally include Prisma in your project.
5. **Run npm install**: Optionally run `npm install` after setting up the project.

### Example

```bash
npm create stack-craft@latest
```

or

```bash
pnpm create stack-craft@latest
```

Follow the prompts to create your project. Once the setup is complete, navigate to your project directory and start the development server:

```bash
cd my-project
npm run dev
```

## Project Structure

The generated project structure will look like this:

```
my-project/
├── prisma/
│   └── schema.prisma (if Prisma is included)
├── src/
│   ├── app.ts (or app.js)
│   └── routes/
│       └── index.ts (or index.js)
├── .env (if Prisma is included)
├── .env.example (if Prisma is included)
├── package.json
└── tsconfig.json (if TypeScript is selected)
```

## Template Files

The template files for different setups can be found in the [Stack Craft Templates repository](https://github.com/dev-rio/stack-craft-templates/).

## Scripts

The generated `package.json` will include the following scripts:

- `build`: Compile the TypeScript code (if TypeScript is selected).
- `start`: Run the compiled code.
- `lint`: Run ESLint on the project.
- `db:generate`: Generate Prisma client (if Prisma is included).
- `db:migrate`: Run Prisma migrations (if Prisma is included).
- `db:push`: Push the Prisma schema to the database (if Prisma is included).
- `db:studio`: Open Prisma Studio (if Prisma is included).

## Available Templates

### Frameworks

- **[Express](https://expressjs.com/)**
- **[Fastify](https://fastify.dev/)**
- **[Hapi](https://hapi.dev/)**
- **[Hono](https://hono.dev/)**
- **[Koa](https://koajs.com/)**

### Additional Tools

- **[Prisma](https://www.prisma.io/)**

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs or feature requests.

## License

This project is licensed under the MIT License.

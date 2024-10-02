#!/usr/bin/env node

import React, { useState, useEffect } from 'react'
import { render, Text, Box, useApp } from 'ink'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'
import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { simpleGit, SimpleGit } from 'simple-git'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const git: SimpleGit = simpleGit()

interface ChoiceItem {
  label: string
  value: string | boolean
}

const FrameworkChoice = ({ onSelect }: { onSelect: (item: any) => void }) => {
  const items: ChoiceItem[] = [
    { label: 'Express', value: 'express' },
    { label: 'Hono', value: 'hono' },
    { label: 'Koa', value: 'koa' },
    { label: 'Hapi', value: 'hapi' },
    { label: 'Fastify', value: 'fastify' }
  ]

  return <SelectInput items={items} onSelect={onSelect} />
}

const LanguageChoice = ({ onSelect }: { onSelect: (item: any) => void }) => {
  const items: ChoiceItem[] = [
    { label: 'TypeScript', value: 'typescript' },
    { label: 'JavaScript', value: 'javascript' }
  ]

  return <SelectInput items={items} onSelect={onSelect} />
}

const ConfirmChoice = ({
  message,
  onConfirm
}: {
  message: string
  onConfirm: (item: any) => void
}) => {
  const items: ChoiceItem[] = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ]

  return (
    <>
      <Text>{message}</Text>
      <SelectInput items={items} onSelect={onConfirm} />
    </>
  )
}

const downloadTemplate = async (
  repoPath: string,
  subPath: string,
  language: string,
  targetPath: string,
  prisma: boolean = false
) => {
  const tempDir = path.join(__dirname, 'temp')

  if (fs.existsSync(tempDir)) {
    fs.removeSync(tempDir)
  }

  await git.clone(`https://github.com/${repoPath}.git`, tempDir, ['--depth=1'])

  const sourcePath = path.join(tempDir, 'templates', subPath, language)
  const prismaPath = path.join(tempDir, 'templates', 'prisma')
  const prismaFiles = ['schema.prisma', '.env', '.env.example']

  fs.copySync(sourcePath, targetPath)
  if (prisma) {
    prismaFiles.forEach((file) => {
      const srcFile = path.join(prismaPath, file)
      let destDir, destFile

      if (file === 'schema.prisma') {
        destDir = path.join(targetPath, 'prisma')
        destFile = path.join(destDir, file)
      } else {
        destDir = targetPath
        destFile = path.join(destDir, file)
      }

      if (fs.existsSync(srcFile)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        fs.copyFileSync(srcFile, destFile)
      } else {
        console.warn(`File ${srcFile} does not exist.`)
      }
    })
  }

  fs.removeSync(tempDir)
}

const DatabaseChoice = ({ onSelect }: { onSelect: (item: any) => void }) => {
  const items: ChoiceItem[] = [
    { label: 'SQLite', value: 'sqlite' },
    { label: 'MySQL', value: 'mysql' },
    { label: 'PostgreSQL', value: 'postgresql' }
  ]

  return <SelectInput items={items} onSelect={onSelect} />
}

const updatePrismaSchema = (targetPath: string, database: string) => {
  const schemaPath = path.join(targetPath, 'prisma', 'schema.prisma')
  if (fs.existsSync(schemaPath)) {
    let schemaContent = fs.readFileSync(schemaPath, 'utf-8')

    const providerMap: { [key: string]: string } = {
      sqlite: 'sqlite',
      mysql: 'mysql',
      postgresql: 'postgresql'
    }
    schemaContent = schemaContent.replace(
      /datasource db\s*{\s*provider\s*=\s*".*"/,
      `datasource db {\n  provider = "${providerMap[database]}"`
    )
    fs.writeFileSync(schemaPath, schemaContent, 'utf-8')
  } else {
    console.error(chalk.red(`schema.prisma not found at ${schemaPath}`))
  }
}

const updateEnvFiles = (targetPath: string, database: string) => {
  const envFiles = ['.env', '.env.example']
  const dbUrlMap: { [key: string]: string } = {
    sqlite: 'file:./db.sqlite',
    mysql: 'mysql://USER:PASSWORD@HOST:PORT/DATABASE',
    postgresql: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE'
  }

  envFiles.forEach((file) => {
    const envFilePath = path.join(targetPath, file)
    if (fs.existsSync(envFilePath)) {
      let envContent = fs.readFileSync(envFilePath, 'utf-8')

      envContent = envContent.replace(
        /DATABASE_URL\s*=\s*.*/,
        `DATABASE_URL="${dbUrlMap[database]}"`
      )
      fs.writeFileSync(envFilePath, envContent, 'utf-8')
    } else {
      console.warn(chalk.yellow(`Env file ${envFilePath} not found.`))
    }
  })
}

const App = () => {
  const { exit } = useApp()
  const [projectName, setProjectName] = useState<string>('')
  const [step, setStep] = useState<number>(0)
  const [framework, setFramework] = useState<string>('')
  const [language, setLanguage] = useState<string>('')
  const [usePrisma, setUsePrisma] = useState<boolean>(false)
  const [database, setDatabase] = useState<string>('')
  const [runNpmInstall, setRunNpmInstall] = useState<boolean>(true)
  const [initGit, setInitGit] = useState<boolean>(false)

  const handleProjectNameSubmit = () => {
    const targetPath = path.join(process.cwd(), projectName || 'my-project')
    if (fs.existsSync(targetPath)) {
      console.error(
        chalk.red(
          `The project name '${projectName || 'my-project'}' already exists. Please enter a different name.`
        )
      )
      setProjectName('')
    } else {
      setStep(1)
    }
  }

  const handleFrameworkSelect = (item: any) => {
    setFramework(item.value as string)
    setStep(2)
  }

  const handleLanguageSelect = (item: any) => {
    setLanguage(item.value as string)
    setStep(3)
  }

  const handleUsePrismaSelect = (item: any) => {
    setUsePrisma(item.value as boolean)
    if (item.value) {
      setStep(4)
    } else {
      setStep(5)
    }
  }

  const handleDatabaseSelect = (item: any) => {
    setDatabase(item.value as string)
    setStep(5)
  }

  const handleRunNpmInstallSelect = (item: any) => {
    setRunNpmInstall(item.value as boolean)
    setStep(6)
  }

  const handleInitGitSelect = (item: any) => {
    setInitGit(item.value as boolean)
    setStep(7)
  }

  useEffect(() => {
    if (step === 7) {
      const repoPath = 'dev-rio/stack-craft-templates'
      const templateSubPath = framework
      const targetPath = path.join(process.cwd(), projectName || 'my-project')

      if (!fs.existsSync(targetPath)) {
        fs.ensureDirSync(targetPath)
      }

      downloadTemplate(repoPath, templateSubPath, language, targetPath, usePrisma).then(() => {
        if (usePrisma) {
          const packageJsonPath = path.join(targetPath, 'package.json')
          if (fs.existsSync(packageJsonPath)) {
            try {
              const packageJson = fs.readJsonSync(packageJsonPath)

              packageJson.dependencies = {
                ...packageJson.dependencies,
                prisma: '^5.16.2',
                '@prisma/client': '^5.16.2',
                dotenv: '^16.4.5',
                express: '^4.18.2',
                cors: '^2.8.5',
                axios: '^1.2.0'
              }

              packageJson.scripts = {
                'db:generate': 'prisma generate',
                'db:migrate': 'prisma migrate deploy',
                'db:push': 'prisma db push',
                'db:studio': 'prisma studio',
                ...packageJson.scripts,
                postinstall: 'prisma generate'
              }

              fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 })
            } catch (error) {
              if (error instanceof Error) {
                console.error(chalk.red(`Error updating package.json: ${error.message}`))
              } else {
                console.error(chalk.red(`Unexpected error updating package.json`))
              }
              process.exit(1)
            }
          } else {
            console.error(chalk.red(`package.json not found in ${targetPath}`))
            process.exit(1)
          }
          updatePrismaSchema(targetPath, database)
          updateEnvFiles(targetPath, database)
        }

        if (initGit) {
          try {
            execSync('git init', { stdio: 'inherit', cwd: targetPath })
            execSync('git add .', { stdio: 'inherit', cwd: targetPath })
            execSync('git commit -m "Initial commit"', { stdio: 'inherit', cwd: targetPath })
          } catch (error) {
            if (error instanceof Error) {
              console.error(chalk.red(`Error initializing git repository: ${error.message}`))
            } else {
              console.error(chalk.red(`Unexpected error initializing git repository`))
            }
            process.exit(1)
          }
        }

        if (runNpmInstall) {
          try {
            execSync('npm install', { stdio: 'inherit', cwd: targetPath })
          } catch (error) {
            if (error instanceof Error) {
              console.error(chalk.red(`Error installing dependencies: ${error.message}`))
            } else {
              console.error(chalk.red(`Unexpected error installing dependencies`))
            }
            process.exit(1)
          }
        }

        console.log(
          chalk.yellowBright(`Project setup is complete. Your project is ready at ${targetPath}`)
        )
        console.log(chalk.yellowBright(`To get started, run the following commands:`))
        console.log(chalk.blue(`cd ${projectName || 'my-project'}`))
        if (!runNpmInstall) {
          console.log(chalk.blue('npm install'))
        }
        console.log(chalk.blue('npm run dev'))

        setTimeout(() => {
          process.exit(0)
        }, 100)
      })
    }
  }, [step])

  return (
    <Box flexDirection="column">
      {step === 0 && (
        <>
          <Text>Enter your project name:</Text>
          <TextInput
            value={projectName}
            placeholder="my-project"
            onChange={setProjectName}
            onSubmit={handleProjectNameSubmit}
          />
        </>
      )}
      {step === 1 && <FrameworkChoice onSelect={handleFrameworkSelect} />}
      {step === 2 && <LanguageChoice onSelect={handleLanguageSelect} />}
      {step === 3 && (
        <ConfirmChoice message="Do you want to include Prisma?" onConfirm={handleUsePrismaSelect} />
      )}
      {step === 4 && <DatabaseChoice onSelect={handleDatabaseSelect} />}
      {step === 5 && (
        <ConfirmChoice
          message="Do you want to run 'npm install' after setup?"
          onConfirm={handleRunNpmInstallSelect}
        />
      )}
      {step === 6 && (
        <ConfirmChoice
          message="Do you want to initialize a git repository?"
          onConfirm={handleInitGitSelect}
        />
      )}
    </Box>
  )
}

render(<App />)

#!/usr/bin/env node

import { useState, useEffect } from 'react'
import { render, Text, Box, useApp } from 'ink'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'
import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageJsonPath = path.join(__dirname, '../package.json')
const { version } = fs.readJsonSync(packageJsonPath)

const FrameworkChoice = ({ onSelect }: { onSelect: (item: any) => void }) => {
  const items = [
    { label: 'Express', value: 'express' },
    { label: 'Hono', value: 'hono' }
  ]

  return <SelectInput items={items} onSelect={onSelect} />
}

const LanguageChoice = ({ onSelect }: { onSelect: (item: any) => void }) => {
  const items = [
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
  const items = [
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

const App = () => {
  const { exit } = useApp()
  const [projectName, setProjectName] = useState('')
  const [step, setStep] = useState(0)
  const [framework, setFramework] = useState('')
  const [language, setLanguage] = useState('')
  const [usePrisma, setUsePrisma] = useState(false)
  const [runNpmInstall, setRunNpmInstall] = useState(true)

  const handleProjectNameSubmit = () => {
    const targetPath = path.join(process.cwd(), projectName || 'my-project')
    if (fs.existsSync(targetPath)) {
      console.error(
        chalk.red(
          `The project name '${projectName}' already exists. Please enter a different name.`
        )
      )
      setProjectName('')
    } else {
      setStep(1)
    }
  }

  const handleFrameworkSelect = (item: any) => {
    setFramework(item.value)
    setStep(2)
  }

  const handleLanguageSelect = (item: any) => {
    setLanguage(item.value)
    setStep(3)
  }

  const handleUsePrismaSelect = (item: any) => {
    setUsePrisma(item.value)
    setStep(4)
  }

  const handleRunNpmInstallSelect = (item: any) => {
    setRunNpmInstall(item.value)
    setStep(5)
  }

  useEffect(() => {
    if (step === 5) {
      const templatePath = path.join(__dirname, 'templates', framework, language)
      const targetPath = path.join(process.cwd(), projectName || 'my-project')

      if (!fs.existsSync(templatePath)) {
        console.error(chalk.red(`Template path does not exist: ${templatePath}`))
        process.exit(1)
      }

      try {
        fs.copySync(templatePath, targetPath)
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(`Error copying files: ${error.message}`))
        } else {
          console.error(chalk.red(`Unexpected error copying files`))
        }
        process.exit(1)
      }

      if (usePrisma) {
        const prismaTemplatePath = path.join(__dirname, 'templates', 'prisma')
        const prismaTargetPath = path.join(targetPath, 'prisma')
        fs.ensureDirSync(prismaTargetPath)

        const prismaFiles = ['schema.prisma']
        prismaFiles.forEach((file) => {
          const prismaFilePath = path.join(prismaTemplatePath, file)
          if (fs.existsSync(prismaFilePath)) {
            fs.copySync(prismaFilePath, path.join(prismaTargetPath, file))
          } else {
            console.error(chalk.red(`${file} not found in ${prismaTemplatePath}.`))
          }
        })

        const envFiles = ['.env', '.env.example']
        envFiles.forEach((file) => {
          const envFilePath = path.join(prismaTemplatePath, file)
          if (fs.existsSync(envFilePath)) {
            fs.copySync(envFilePath, path.join(targetPath, file))
          } else {
            console.error(chalk.red(`${file} not found in ${prismaTemplatePath}.`))
          }
        })

        const packageJsonPath = path.join(targetPath, 'package.json')
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = fs.readJsonSync(packageJsonPath)
            packageJson.dependencies = {
              ...packageJson.dependencies,
              prisma: '^5.16.2',
              '@prisma/client': '^5.16.2',
              dotenv: '^16.4.5'
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
      exit()
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
      {step === 4 && (
        <ConfirmChoice
          message="Do you want to run 'npm install' after setup?"
          onConfirm={handleRunNpmInstallSelect}
        />
      )}
    </Box>
  )
}

render(<App />)

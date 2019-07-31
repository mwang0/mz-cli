#!/usr/bin/env node

const { enhanceErrorMessages } = require('../lib/utils')
const program = require('commander')
const chalk = require('chalk')

program
  .version(require('../package.json').version)
  .usage('<command> [options]')

program
  .command('create <project-name>')
  .description('创建一个新项目')
  .action((name, cmd) => {
    require('../lib/create')(name, {}).catch((ex) => {
      console.log(ex)
      process.exit(1)
    })
  })

program.commands.forEach((c) => c.on('--help', () => console.log()))

enhanceErrorMessages('missingArgument', (argName) => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', (optionName) => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return (
    `Missing required argument for option ${chalk.yellow(option.flags)}` +
    (flag ? `, got ${chalk.yellow(flag)}` : ``)
  )
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

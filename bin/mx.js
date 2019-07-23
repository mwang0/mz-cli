#!/usr/bin/env node

const chalk = require('chalk')
const semver = require('semver')
const program = require('commander')

program.version(require('../package.json').version).usage('<command> [options]')

program
  .command('create <project-name>')
  .description('创建一个新项目')
  .action((name, cmd) => {
    require('../lib/create')(name, {}).catch(ex => {
      console.log(ex)
      process.exit(1)
    })
  })

program.commands.forEach(c => c.on('--help', () => console.log()))

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

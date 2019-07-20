/* 
  utils.js
  Created by M.Wang [cn_wang@139.com]
  2019-07-16 15:31 星期二
*/

const readline = require('readline')
const chalk = require('chalk')
const execa = require('execa')

exports.exit = function(code = 0) {
  process.exit(code)
}

exports.clearConsole = title => {
  if (process.stdout.isTTY) {
    readline.cursorTo(process.stdout, 0, 0)
    readline.clearScreenDown(process.stdout)
    if (title) {
      console.log(title)
    }
    console.log()
  }
}

let versionCached
exports.getVersion = async function() {
  if (versionCached) return versionCached

  const local = require('../package.json').version
  //todo
  let latest = local
  return (versionCached = {
    current: local,
    last: local
  })
}

exports.getTitle = async function() {
  let { current, last } = await exports.getVersion()
  let title = chalk.bold.blue('M CLI v' + current)
  return title
}
// 获取 git user.name
exports.getUserName = async function() {
  let name = await exports.run('git', ['config', '--get', 'user.name'])
  return name || 'test'
}

// 获取 git user.email
exports.getUserEmail = async function() {
  let email = await exports.run('git', ['config', '--get', 'user.email'])
  return email || 'test@test.com'
}

// 执行 shell 命令
exports.run = async function(cmd, args) {
  if (!args) {
    ;[cmd, ...args] = cmd.split(/\s+/)
  }

  const { stdout } = await execa(cmd, args)
  if (stdout) {
    return stdout
  }
  return null
}

exports.trace = (msg = '') => {
  console.log(msg)
}
exports.traceDone = msg => {
  console.log(chalk.green(msg))
}
exports.traceWarn = msg => {
  console.log(chalk.yellow('⚠️' + msg))
}
exports.traceError = msg => {
  console.log(chalk.red('❌' + msg))
  if (msg instanceof Error) {
    console.error(msg.stack)
  }
}

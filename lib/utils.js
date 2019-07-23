/*
  utils.js
  Created by M.Wang [cn_wang@139.com]
  2019-07-16 15:31 星期二
*/

const chalk = require('chalk')
const execa = require('execa')
const readline = require('readline')
const updateNotifier = require('update-notifier')

exports.exit = function (code = 0) {
  process.exit(code)
}

exports.clearConsole = (title) => {
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
exports.getVersion = async function () {
  if (versionCached) return versionCached
  const pkg = require('../package.json')
  const local = pkg.version
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24
  })
  versionCached = {
    current: local,
    latest: local
  }
  if (notifier.update) versionCached.latest = notifier.update.latest
  return versionCached
}

exports.getTitle = async function () {
  const { current, latest } = await exports.getVersion()
  let title = chalk.bold.blue('M CLI v' + current)
  if (latest !== current) {
    title += chalk.green(`
┌───────────${`─`.repeat(latest.length)}──┐
│  可用更新: ${latest}  │
└───────────${`─`.repeat(latest.length)}──┘`)
  }
  return title
}
// 获取 git user.name
exports.getUserName = async function () {
  const name = await exports.run('git', ['config', '--get', 'user.name'])
  return name || 'test'
}

// 获取 git user.email
exports.getUserEmail = async function () {
  const email = await exports.run('git', ['config', '--get', 'user.email'])
  return email || 'test@test.com'
}

// 执行 shell 命令
exports.run = async function (cmd, args) {
  if (!args) {
    [cmd, ...args] = cmd.split(/\s+/)
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
exports.traceDone = (msg) => {
  console.log('🎉  ' + chalk.green(msg))
}
exports.traceWarn = (msg) => {
  console.log('⚠️  ', chalk.yellow(msg))
}
exports.traceError = (msg) => {
  console.log('❌  ', chalk.red(msg))
  if (msg instanceof Error) {
    console.error(msg.stack)
  }
}

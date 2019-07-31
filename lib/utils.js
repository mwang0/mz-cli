/*
  utils.js
  Created by M.Wang [cn_wang@139.com]
  2019-07-16 15:31 星期二
*/

const chalk = require('chalk')
const execa = require('execa')
const program = require('commander')
const readline = require('readline')
const spawn = require('child_process').spawn
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
exports.run = async function (cmd, args, opts = {}) {
  if (!args) {
    [cmd, ...args] = cmd.split(/\s+/)
  }

  const { stdout } = await execa(cmd, args, opts)
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

exports.isYarn = async function isYarn () {
  let res = true
  try {
    await exports.run('yarn', ['-v'])
  } catch (err) {
    res = false
  }
  return res
}

/**
 * 运行指定命令
 * @date 2019-07-24
 * @param {string} cmd
 * @param {array<string>} args
 * @param {object} options
 * @returns {promise}
 */
exports.runCmd = function runCmd (cmd, args, options) {
  return new Promise((resolve, reject) => {
    const s = spawn(
      cmd,
      args,
      Object.assign(
        {
          cwd: process.cwd(),
          stdio: 'inherit',
          shell: true
        },
        options
      )
    )

    s.on('exit', () => {
      resolve()
    })
  })
}

/**
 * 依赖安装
 * @date 2019-07-23
 * @param {String} cwd
 * @returns {Promise}
 */
exports.installDependencies = async function installDependencies (cwd) {
  const { trace, runCmd, isYarn } = exports
  let executable = 'npm'
  let args = ['install']
  const isyarn = await isYarn()
  if (isyarn) {
    executable = 'yarn'
    args = []
  }
  trace(`\n'⭐️  安装项目依赖...'`)
  return runCmd(executable, args, { cwd })
}

exports.enhanceErrorMessages = function enhanceErrorMessages (methodName, log) {
  program.Command.prototype[methodName] = function (...args) {
    if (methodName === 'unknownOptions' && this._allowUnknowOptions) {
      // eslint-disable-next-line no-useless-return
      return
    }

    this.outputHelp()
    console.log(chalk.red(log(...args)))
    console.log()
    process.exit(1)
  }
}

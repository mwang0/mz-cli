/*
  create.js
  Created by M.Wang [cn_wang@139.com]
  2019-07-16 15:31 星期二
*/
const ejs = require('ejs')
const path = require('path')
const chalk = require('chalk')
const fg = require('fast-glob')
const fs = require('fs-extra')
const inquirer = require('inquirer')
const userHome = require('user-home')
const dl = require('download-git-repo')
const updateNotifier = require('update-notifier')
const validateProjectName = require('validate-npm-package-name')
const {
  exit,
  clearConsole,
  getTitle,
  getUserName,
  getUserEmail,
  trace,
  traceWarn,
  traceError
} = require('./utils')
const { logWithSpinner, stopSpinner, changeSpinnerMsg } = require('./spinner')

async function create (projectName, options) {
  const cwd = process.cwd()
  const inCurrent = projectName === '.'
  const name = inCurrent ? path.relative('../', cwd) : projectName
  const targetDir = path.resolve(cwd, projectName || '.')

  // 项目名称校验
  const result = validateProjectName(name)
  if (!result.validForNewPackages) {
    traceError('无效的项目名称：' + name)
    result.errors &&
      result.errors.forEach((error) => {
        traceError(error)
      })
    result.warnings &&
      result.warnings.forEach((warn) => {
        traceWarn(warn)
      })
    exit(1)
  }

  if (fs.existsSync(targetDir)) {
    if (options.force) {
      await fs.remove(targetDir)
    } else {
      const title = await getTitle()
      await clearConsole(title)
      if (inCurrent) {
        const { ok } = await inquirer.prompt({
          name: 'ok',
          type: 'confirm',
          message: '在当前目录创建项目?'
        })

        if (!ok) {
          return
        }
      } else {
        const { action } = await inquirer.prompt({
          name: 'action',
          type: 'list',
          message: `项目目录 ${chalk.cyan(targetDir)} 已存在，请选择：`,
          choices: [
            { name: '覆盖', value: 'overwrite' },
            { name: '合并', value: 'merge' },
            { name: '取消', value: false }
          ]
        })

        if (!action) {
          return
        } else if (action === 'overwrite') {
          trace('♻️' + `  正在删除 ${chalk.cyan(targetDir)} ...`)
          await fs.remove(targetDir)
        }
      }
    }
  }

  await clearConsole(await getTitle())
  const { template } = await inquirer.prompt({
    type: 'list',
    name: 'template',
    message: '选择工程模板',
    choices: [{ name: 'npm        ->  npm模块工程', value: 'npm' }]
  })

  await clearConsole(await getTitle())
  logWithSpinner('✨', '项目创建在 ' + chalk.yellow(targetDir))
  logWithSpinner('💡', '项目类型为 ' + chalk.yellow(template))
  stopSpinner()
  trace()
  const tmpPath = path.join(userHome, '.m-templates', template)
  logWithSpinner('下载项目模板')
  if (fs.existsSync(tmpPath)) {
    trace('test')
    changeSpinnerMsg('检查更新')
    let pkg = path.join(tmpPath, 'package.json')
    if (fs.existsSync(pkg)) {
      pkg = require(pkg)
      const notifier = updateNotifier({
        pkg,
        updateCheckInterval: 1000 * 60 * 60 * 24
      })
      if (notifier.update) {
        stopSpinner()
        trace(
          '🚀' +
            '更新项目【' +
            chalk.yellow(template) +
            '】模板：' +
            chalk.grey.dim(notifier.current) +
            '~' +
            chalk.green.dim(notifier.latest)
        )
        await fs.remove(tmpPath)
        logWithSpinner('下载项目模板')
        await download(template, tmpPath)
      }
    }
  } else {
    await download(template, tmpPath)
  }

  logWithSpinner('创建项目文件')
  await generate(tmpPath, targetDir)
  stopSpinner()
  trace()
}

async function download (template, tmpsPath) {
  await new Promise((resolve, reject) => {
    try {
      dl('m-templates/' + template, tmpsPath, null, (err) => {
        if (err) {
          stopSpinner({ symbol: '❌' })
          traceError(err)
          reject(err)
          exit(1)
        }
        resolve()
      })
    } catch (error) {
      stopSpinner({ symbol: '❌' })
      traceError(error)
      reject(error)
      exit(1)
    }
  })
}

async function generate (tmpDir, targetDir) {
  const meta = path.join(tmpDir, 'meta.js')
  let opts = {}
  if (fs.existsSync(meta)) {
    const tmp = require(meta)
    if (tmp !== Object(tmp)) {
      traceError('meta.js 需要导出一个对象')
      exit(1)
    }
    opts = tmp
  }
  const templateDir = path.join(tmpDir, 'template')
  if (!fs.existsSync(templateDir)) {
    traceError('template目录不存在')
    exit(1)
  }
  let params = opts.preset || {}
  params.gitUserName = await getUserName()
  params.gitUserEmail = await getUserEmail()
  if (opts.prompts) {
    params = await inquirer.prompt(opts)
  }
  //
  if (process.cwd() !== targetDir) {
    await fs.ensureDir(targetDir)
  }

  // 渲染模版文件
  const files = await fg(['**/*'], { cwd: templateDir, dot: true })
  await Promise.all(
    files.map((f) => {
      const fn = async () => {
        let content = await fs.readFile(path.join(templateDir, f), 'utf8')
        content = ejs.render(content, params)
        const filepath = path.join(targetDir, f)
        try {
          await fs.writeFile(filepath, content, { flag: 'a' })
        } catch (error) {
          console.error(error)
        }
      }

      return fn()
    })
  )
}

module.exports = (...args) => {
  return create(...args).catch((err) => {
    if (err) traceError(err)
    process.exit(1)
  })
}

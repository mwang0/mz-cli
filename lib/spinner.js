const ora = require('ora')
const chalk = require('chalk')

const spinner = ora()
let lastMsg = null

exports.logWithSpinner = (symbol, msg) => {
  if (!msg) {
    msg = symbol
    symbol = chalk.green('✔')
  }
  if (lastMsg) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text
    })
  }
  spinner.text = ' ' + msg
  lastMsg = {
    symbol: symbol + ' ',
    text: msg
  }
  spinner.start()
}

exports.changeSpinnerMsg = (msg = '') => {
  spinner.text = lastMsg ? `${lastMsg}: ${msg}` : msg
}

exports.stopSpinner = (persist) => {
  if (lastMsg && persist !== false) {
    let { symbol, text } = lastMsg
    if (persist && 'symbol' in persist) symbol = persist.symbol
    if (persist && 'text' in persist) text = persist.text
    spinner.stopAndPersist({
      symbol,
      text
    })
  } else {
    spinner.stop()
  }
  lastMsg = null
}

exports.pauseSpinner = () => {
  spinner.stop()
}

exports.resumeSpinner = () => {
  spinner.start()
}

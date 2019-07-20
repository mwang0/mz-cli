const glob = require('fast-glob')
const path = require('path')
const files = glob.sync(['**/*'], { dot: true, cwd: path.join(__dirname, 'templates/npm/template/') })

console.dir(files)

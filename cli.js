const cli = require('./lib/cli')
const options = { boolean: [ 'd' ] }
cli(require('minimist')(process.argv.slice(2), options))

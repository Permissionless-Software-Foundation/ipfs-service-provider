import common from './env/common.js'

import development from './env/development.js'
import production from './env/production.js'
import test from './env/test.js'

const env = process.env.SVC_ENV || 'development'
console.log(`Loading config for this environment: ${env}`)

let config = development
if (env === 'test') {
  config = test
} else if (env === 'prod') {
  config = production
}

export default Object.assign({}, common, config)

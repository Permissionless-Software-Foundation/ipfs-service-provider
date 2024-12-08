/*
  Use Case library for tracking usage. This library contains business logic
  for tracking the usage of REST API and JSON RPC calls. This library is used
  by admins to keep an eye on how many API calls were made in a 24-hour and
  1-hour time period.
*/

// This global variable is used to share data between the REST middleware and
// the Usage Use Case class instance.
const restCalls = []

class UsageUseCases {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating Usage Use Cases library.'
      )
    }

    // Bind 'this' object to all subfunctions
    this.getRestSummary = this.getRestSummary.bind(this)

    // State
  }

  // Track the calls to a REST API
  getRestSummary (inObj = {}) {
    try {
      console.log(`getRestSummary(): There have been ${restCalls.length} REST calls`)

      return restCalls.length
    } catch (err) {
      console.error('Error in usage-use-cases.js/getRestSummary()')
      throw err
    }
  }
}

// This Koa middleware is called any time there is a REST API. It logs the
// details from the request object.
function usageMiddleware () {
  return async (ctx, next) => {
    try {
      await next()

      console.log('ctx.request: ', ctx.request)
      const now = new Date()

      const reqObj = {
        ip: ctx.request.ip,
        url: ctx.request.url,
        method: ctx.request.method,
        timestamp: now.getTime()
      }
      console.log('reqObj: ', reqObj)

      restCalls.push(reqObj)
    } catch (err) {
      ctx.status = err.status || 500
      ctx.body = err.message
      ctx.app.emit('error', err, ctx)
    }
  }
};

export { UsageUseCases, usageMiddleware }

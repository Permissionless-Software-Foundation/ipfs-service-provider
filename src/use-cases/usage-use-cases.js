/*
  Use Case library for tracking usage. This library contains business logic
  for tracking the usage of REST API and JSON RPC calls. This library is used
  by admins to keep an eye on how many API calls were made in a 24-hour and
  1-hour time period.
*/

// This global variable is used to share data between the REST middleware and
// the Usage Use Case class instance.
let restCalls = []

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
    this.cleanUsage = this.cleanUsage.bind(this)
    this.getRestSummary = this.getRestSummary.bind(this)
    this.getTopIps = this.getTopIps.bind(this)
    this.getTopEndpoints = this.getTopEndpoints.bind(this)

    // State
  }

  // Clean up the state by removing entries that are older than 24 hours. This
  // ensures stats reflect only the last 24 hours.
  // This function is called by a Timer Controller.
  cleanUsage () {
    try {
      const now = new Date()
      const twentyFourHoursAgo = now.getTime() - (60000 * 60 * 24)

      restCalls = restCalls.filter(x => x.timestamp > twentyFourHoursAgo)
      return restCalls
    } catch (err) {
      console.error('Error in usage-use-cases.js/cleanUsage()')
      throw err
    }
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

  // Get the top 20 IP addresses from the stats.
  getTopIps () {
    try {
      const ips = restCalls.map(x => x.ip)
      // Create a Map to count occurrences of each IP address string
      const countMap = new Map()
      ips.forEach(ip => {
        countMap.set(ip, (countMap.get(ip) || 0) + 1)
      })

      // Convert the Map into an array of objects with `str` and `cnt` properties
      const result = Array.from(countMap, ([ip, cnt]) => ({ ip, cnt }))

      // Sort the results by the `cnt` property in descending order
      result.sort((a, b) => b.cnt - a.cnt)

      // Ensure the result has at most 20 elements
      return result.slice(0, 20)
    } catch (err) {
      console.error('Error in usage-use-cases.js/getTopIps()')
      throw err
    }
  }

  // Get the top 20 most consumed endpoints.
  getTopEndpoints () {
    try {
      const endpoints = restCalls.map(x => `${x.method} ${x.url}`)

      // Create a Map to count occurrences of each IP address string
      const countMap = new Map()
      endpoints.forEach(endpoint => {
        countMap.set(endpoint, (countMap.get(endpoint) || 0) + 1)
      })

      // Convert the Map into an array of objects with `str` and `cnt` properties
      const result = Array.from(countMap, ([endpoint, cnt]) => ({ endpoint, cnt }))

      // Sort the results by the `cnt` property in descending order
      result.sort((a, b) => b.cnt - a.cnt)

      // Ensure the result has at most 20 elements
      return result.slice(0, 20)
    } catch (err) {
      console.error('Error in usage-use-cases.js/getTopEndpoints()')
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

      // console.log('ctx.request: ', ctx.request)
      const now = new Date()

      const reqObj = {
        ip: ctx.request.ip,
        url: ctx.request.url,
        method: ctx.request.method,
        timestamp: now.getTime()
      }
      // console.log('reqObj: ', reqObj)

      restCalls.push(reqObj)
    } catch (err) {
      ctx.status = err.status || 500
      ctx.body = err.message
      ctx.app.emit('error', err, ctx)
    }
  }
};

export { UsageUseCases, usageMiddleware, restCalls }

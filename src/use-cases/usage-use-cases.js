/*
  Use Case library for tracking usage. This library contains business logic
  for tracking the usage of REST API and JSON RPC calls. This library is used
  by admins to keep an eye on how many API calls were made in a 24-hour and
  1-hour time period.

  Usage stats are held in memory. But they are periodically backed up to the
  Mongo database. On startup, the usage stats are loaded from the database.
  This allows the usage stats to be persisted across restarts.
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

    // Encapsulate dependencies
    this.UsageModel = this.adapters.localdb.Usage

    // Bind 'this' object to all subfunctions
    this.cleanUsage = this.cleanUsage.bind(this)
    this.getRestSummary = this.getRestSummary.bind(this)
    this.getTopIps = this.getTopIps.bind(this)
    this.getTopEndpoints = this.getTopEndpoints.bind(this)
    this.clearUsage = this.clearUsage.bind(this)
    this.saveUsage = this.saveUsage.bind(this)
    this.loadUsage = this.loadUsage.bind(this)

    // State
  }

  // Clean up the state by removing entries that are older than 24 hours. This
  // ensures stats reflect only the last 24 hours.
  // This function is called by a Timer Controller.
  cleanUsage () {
    try {
      const now = new Date()
      const twentyFourHoursAgo = now.getTime() - (60000 * 60 * 24)

      console.log('cleanUsage() now: ', now)
      console.log('cleanUsage() restCalls.length before filtering: ', restCalls.length)
      restCalls = restCalls.filter(x => x.timestamp > twentyFourHoursAgo)
      console.log('cleanUsage() restCalls.length after filtering: ', restCalls.length)

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

  // Clear the usage database data
  async clearUsage () {
    try {
      await this.UsageModel.deleteMany({})

      // Debugging: verify the database is empty
      // Delete this code after debugging
      const usage = await this.UsageModel.find({})
      console.log('clearUsage() usage: ', usage)
      return true
    } catch (err) {
      console.error('Error in usage-use-cases.js/clearUsage()')
      throw err
    }
  }

  // Save the usage data to the database
  async saveUsage (inObj = {}) {
    try {
      for (let i = 0; i < restCalls.length; i++) {
        const thisRestCall = restCalls[i]

        // Debugging: delete this code after debugging
        // if (i === 5) {
        //   console.log('saveUsage() thisRestCall: ', thisRestCall)
        // }

        const usageData = {
          ip: thisRestCall.ip,
          url: thisRestCall.url,
          method: thisRestCall.method,
          timestamp: thisRestCall.timestamp
        }

        const usage = new this.UsageModel(usageData)
        await usage.save()
      }
      return true
    } catch (err) {
      console.error('Error in usage-use-cases.js/saveUsage()')
      throw err
    }
  }

  // Load usage data from the database
  async loadUsage () {
    try {
      const usage = await this.UsageModel.find({})
      // console.log('usage: ', usage)

      // Debugging: delete this code after debugging
      if (usage[5]) {
        console.log('loadUsage() usage[5]: ', usage[5])
      }

      restCalls = usage
      return usage
    } catch (err) {
      console.error('Error in usage-use-cases.js/loadUsage(): ', err)
      return false
      // throw err
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

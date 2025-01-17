/*
  REST API Controller library for the /usage route
*/

// Global npm libraries

// Local libraries
import wlogger from '../../../adapters/wlogger.js'

class UsageRESTControllerLib {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /usage REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /usage REST Controller.'
      )
    }

    // Encapsulate dependencies

    // Bind 'this' object to all subfunctions
    this.getStatus = this.getStatus.bind(this)
    this.getTopIps = this.getTopIps.bind(this)
    this.getTopEndpoints = this.getTopEndpoints.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  /**
   * @api {get} /usage Get status on IPFS infrastructure
   * @apiPermission public
   * @apiName GetUsageStatus
   * @apiGroup REST Usage
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5020/usage
   *
   */
  getStatus (ctx) {
    try {
      // const status = await this.adapters.ipfs.getStatus()
      const status = this.useCases.usage.getRestSummary()

      ctx.body = { status }
    } catch (err) {
      wlogger.error('Error in usage/controller.js/getStatus(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  /**
   * @api {get} /usage/ips Get top IP addresses consuming the REST API
   * @apiPermission public
   * @apiName GetUsageIPs
   * @apiGroup REST Usage
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5020/usage/ips
   *
   */
  getTopIps (ctx) {
    try {
      const ips = this.useCases.usage.getTopIps()

      ctx.body = { ips }
    } catch (err) {
      wlogger.error('Error in usage/controller.js/getTopIps(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  /**
   * @api {get} /usage/endpoints Get top endpoints consumed from the REST API
   * @apiPermission public
   * @apiName GetUsageEndpoints
   * @apiGroup REST Usage
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5020/usage/endpoints
   *
   */
  getTopEndpoints (ctx) {
    try {
      const endpoints = this.useCases.usage.getTopEndpoints()

      ctx.body = { endpoints }
    } catch (err) {
      wlogger.error('Error in usage/controller.js/getTopEndpoints(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  // DRY error handler
  handleError (ctx, err) {
    // If an HTTP status is specified by the buisiness logic, use that.
    if (err.status) {
      if (err.message) {
        ctx.throw(err.status, err.message)
      } else {
        ctx.throw(err.status)
      }
    } else {
      // By default use a 422 error if the HTTP status is not specified.
      ctx.throw(422, err.message)
    }
  }
}

// module.exports = IpfsRESTControllerLib
export default UsageRESTControllerLib

/*
  REST API library for the /usage route.
*/

// Public npm libraries.
import Router from 'koa-router'

// Local libraries.
import UsageRESTControllerLib from './controller.js'
import Validators from '../middleware/validators.js'

// let _this

class UsageRouter {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating IPFS REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating IPFS REST Controller.'
      )
    }

    const dependencies = {
      adapters: this.adapters,
      useCases: this.useCases
    }

    // Encapsulate dependencies.
    this.usageRESTController = new UsageRESTControllerLib(dependencies)
    this.validators = new Validators()

    // Instantiate the router and set the base route.
    const baseUrl = '/usage'
    this.router = new Router({ prefix: baseUrl })

    // _this = this
  }

  attach (app) {
    if (!app) {
      throw new Error(
        'Must pass app object when attaching REST API controllers.'
      )
    }

    // Define the routes and attach the controller.
    this.router.get('/', this.usageRESTController.getStatus)
    this.router.get('/ips', this.usageRESTController.getTopIps)
    this.router.get('/endpoints', this.usageRESTController.getTopEndpoints)

    // Attach the Controller routes to the Koa app.
    app.use(this.router.routes())
    app.use(this.router.allowedMethods())
  }
}

// module.exports = BchRouter
export default UsageRouter

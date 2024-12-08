/*
  This Controller library is concerned with timer-based functions that are
  kicked off periodicially.
*/

import config from '../../config/index.js'

class TimerControllers {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Timer Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Timer Controller libraries.'
      )
    }

    this.debugLevel = localConfig.debugLevel

    // Encapsulate dependencies
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.exampleTimerFunc = this.exampleTimerFunc.bind(this)
    this.cleanUsage = this.cleanUsage.bind(this)

    // this.startTimers()
  }

  // Start all the time-based controllers.
  startTimers () {
    // Any new timer control functions can be added here. They will be started
    // when the server starts.
    this.optimizeWalletHandle = setInterval(this.exampleTimerFunc, 60000 * 60)
    this.cleanUsageHandle = setInterval(this.cleanUsage, 60000 * 60) // 1 hour

    return true
  }

  stopTimers () {
    clearInterval(this.optimizeWalletHandle)
    clearInterval(this.cleanusageHandle)
  }

  // Replace this example function with your own timer handler.
  exampleTimerFunc (negativeTest) {
    try {
      console.log('Example timer controller executed.')

      if (negativeTest) throw new Error('test error')

      return true
    } catch (err) {
      console.error('Error in exampleTimerFunc(): ', err)

      // Note: Do not throw an error. This is a top-level function.
      return false
    }
  }

  // Clean the usage state so that stats reflect the last 24 hours.
  cleanUsage () {
    try {
      this.useCases.usage.cleanUsage()
    } catch (err) {
      console.error('Error in time-controller.js/cleanUsage(): ', err)

      // Note: Do not throw an error. This is a top-level function.
      return false
    }
  }
}

export default TimerControllers

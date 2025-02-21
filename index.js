import Server from './bin/server.js'
const server = new Server()

process.on('unhandledRejection', (reason, promise) => {
  console.log(`Handling ${reason.code} error. stack: `, reason)
})

server.startServer()

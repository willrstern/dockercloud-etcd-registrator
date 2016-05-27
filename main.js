require('babel-register')
var syncContainers = require('./src/docker-watch').default

syncContainers()
setInterval(syncContainers, process.env.REGISTER_INTERVAL || 5000)

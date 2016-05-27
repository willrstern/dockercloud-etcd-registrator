require('babel-register')
var syncContainers = require('./src/docker-watch')

syncContainers()
setInterval(syncContainers, process.env.REGISTER_INTERVAL || 5000)

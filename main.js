require('babel-register')
var syncContainers = require('./src/docker-watch')

syncContainers()
setInterval(syncContainers, REGISTER_INTERVAL || 5000)

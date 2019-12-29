const follower = require('./ring/follower')
setTimeout(() => {
  follower.createClient()
  follower.startMonitoring()
}, 3000)

const follower = require('./ring/follower')
setTimeout(() => {
  follower.start()
  follower.startMonitoring()
}, 3000)

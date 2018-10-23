let express = require('express')
let app = express()
let middlewares = require('./middlewares')

// Configure REST interceptors
// open tracing standard
app.use(middlewares.openTracing)

// expose REST API
app.get('/schedules', require('./get'))
app.post('/schedules', require('./post'))
app.put('/schedules', require('./put'))
app.delete('/schedules', require('./delete'))
app.listen(3000)
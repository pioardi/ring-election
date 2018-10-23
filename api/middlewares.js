const opentracing = require('opentracing')
// NOTE: the default OpenTracing tracer does not record any tracing information.
// Replace this line with the tracer implementation of your choice.
const tracer = new opentracing.Tracer()
let openTracingMD = (req, res, next) => {
  let span = tracer.startSpan('http_request')
  req.headers.traceID = span
  res.setHeader('X-TRACE-ID', span)
  span.setTag(opentracing.Tags.HTTP_URL, req.url)
  span.setTag(opentracing.Tags.HTTP_STATUS_CODE, req.method)
  next()
  span.finish()
}
module.exports = {
  openTracing: openTracingMD
}
// for production mode , you need to set variable in heroku
// or in cloud service for node process
/**
*   Set all keys of object in input as process variables , only if NODE_ENV is setted to developent/test .
*/
let configure = (jsonObject) => {
  const env = process.env.NODE_ENV || 'development'
  if (!jsonObject) {
    throw new Error('Cannot make configuration with an object not defined')
  }
  if (env === 'development' || env === 'test') {
    const envConfig = jsonObject[env]
    Object.keys(envConfig).forEach((key) => {
      console.log(`${key} : ${envConfig[key]}`)
      process.env[key] = envConfig[key]
    })
  }
}
module.exports = configure

/**
 * Used to expose functions and objects.
 */
'use strict'

module.exports = {
  leader: require('./ring/leader'),
  follower: require('./ring/follower')
}

/**
 * This component will sent periodically an heart beat on the ring.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

const HEART_BEAT = 'HEART_BEAT'
// frequency to sent an heartbeat ( in ms )
const { heartbeatFrequency } = require('./config')
const { MESSAGE_SEPARATOR } = require('./constants')

/**
 * heartbeat for seed node
 * @param {*} client , seed node connection.
 */
const heartbeatLogic = (client, id) => {
  // infinite recursion.
  if (client.writable) {
    client.write(
      JSON.stringify({ type: HEART_BEAT, msg: id, id: id }) + MESSAGE_SEPARATOR
    )
  }
}

/**
 * heartbeat for seed node
 * @param {*} client , seed node connection.
 */
const heartbeat = (client, id) => {
  setInterval(() => heartbeatLogic(client, id), heartbeatFrequency)
}

module.exports = heartbeat

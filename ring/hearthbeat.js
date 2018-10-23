/**
 * This component will sent periodically an hearth beat on the ring.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

const HEARTH_BEAT = 'HEARTH_BEAT';
// frequency to sent an hearthbeat ( in ms )
const hearthbeatFrequency = process.env.HEARTH_BEAT_FREQUENCY || 1000;
const { MESSAGE_SEPARATOR } = require('./constants');

/**
 * hearthbeat for seed node
 * @param {*} client , seed node connection.
 */
let hearthbeatLogic = (client, id) => {
  // infinite recursion.
  if (client.writable)
    client.write(JSON.stringify({ type: HEARTH_BEAT, msg: id, id: id }) + MESSAGE_SEPARATOR);
}

/**
 * hearthbeat for seed node
 * @param {*} client , seed node connection.
 */
let hearthbeat = (client, id) => {
  setInterval(() => hearthbeatLogic(client, id), hearthbeatFrequency);
}

module.exports = hearthbeat;

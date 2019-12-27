'use strict'
/**
 * This will emit events
 * @author Alessandro Pio Ardizio
 * @since 1.1.0
 * @exports a custom event emitter that will emit events for node added/removed, leader elected , partitions assigned/removed
 */
const EventEmitter = require('events')
/**
 * Event emitter to check nodes added and removed from the cluster.
 */
class RingEmitter extends EventEmitter {}
const ringEmitter = new RingEmitter()

module.exports = ringEmitter

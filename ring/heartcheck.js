/**
 * This component will check periodically if some node is not sending
 nodes from the ring.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'
const log = require('./logger')
const Rx = require('@reactivex/rxjs')
/** max time to wait for an heartbeat(in ms) */
const { maxInactiveTime, heartbeatCheckFrequency } = require('./config')
const partitioner = require('./partitioner')
const util = require('./util')
const { NODE_REMOVED } = require('./constants')
// --------------------- HEART ---------------------
/**
 * Check if some node is dead.
 */
const heartbeatCheckLogic = function (heart, addresses) {
  if (heart.size <= 0) {
    log.debug('No other nodes in the ring')
    return
  }
  log.debug('Doing an heart check')
  Rx.Observable.from(heart)
    .filter(isNodeToRemove)
    .map((entry, index) => removingNodes(entry, index, heart, addresses))
    .subscribe()
}

/**
 * Start a periodic check to see if any node should be removed from the cluster.
 * @param {Map} heart
 * @param {Array} addresses
 */
const heartbeatCheck = function (heart, addresses) {
  setInterval(
    () => heartbeatCheckLogic(heart, addresses),
    heartbeatCheckFrequency
  )
}

/**
 * Check if a node is to remove.
 * @param {map entry} entry
 * @param {* index into the map} index
 */
const isNodeToRemove = entry => {
  return Date.now() - entry[1] > maxInactiveTime
}
/**
 * Remove nodes from data structures.
 * @param {map entry} entry
 * @param {* index into the map} index
 */
const removingNodes = (entry, index, heart, addresses) => {
  const removeFromHeart = []
  log.info('Removing a node')
  // time expired , clean up maps.
  removeFromHeart.push(entry[0])
  const host = util.searchClientById(entry[0], addresses)
  // in case that a client is explicitly disconnected , the entry is already removed from the Map.
  // rebalance partitions when a server is removed.
  if (host) {
    partitioner.rebalancePartitions(host.client, addresses)
  }
  util.broadcastMessage(addresses, { type: NODE_REMOVED, msg: addresses })
  removeFromHeart.forEach(e => {
    heart.delete(e)
  })
}

module.exports = heartbeatCheck

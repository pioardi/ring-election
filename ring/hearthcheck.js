/**
 * This component will check periodically if some node is not sending 
 nodes from the ring.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict';
let log = require('./logger');
const Rx = require('@reactivex/rxjs');
/** max time to wait for an hearthbeat(in ms) */
const maxInactiveTime = process.env.MAX_INACTIVE_TIME || 10000;
/** frequency to check if nodes are alive(in ms) */
const hearthbeatCheckFrequency = process.env.HEARTH_BEAT_CHECK_FREQUENCY || 3000;
const partitioner = require('./partitioner');
const util = require('./util');
const { NODE_REMOVED } = require('./constants');
// --------------------- HEARTH --------------------- 
/**
 * Check if some node is dead.
 */
let hearthbeatCheckLogic = function (hearth, addresses) {
   if (hearth.size <= 0) {
      log.debug('No other nodes in the ring');
      return;
   }
   log.debug('Doing an hearth check');
   Rx.Observable.from(hearth)
      .filter(isNodeToRemove)
      .map((entry, index) => removingNodes(entry, index, hearth, addresses))
      .subscribe();
};

/**
 * Start a periodic check to see if any node should be removed from the cluster.
 * @param {Map} hearth 
 * @param {Array} addresses 
 */
let hearthbeatCheck = function (hearth, addresses) {
   setInterval(() => hearthbeatCheckLogic(hearth, addresses), hearthbeatCheckFrequency);
};


/**
 * Check if a node is to remove.
 * @param {map entry} entry 
 * @param {* index into the map} index 
 */
let isNodeToRemove = (entry, index) => {
   return Date.now() - entry[1] > maxInactiveTime;
};
/**
 * Remove nodes from data structures.
 * @param {map entry} entry 
 * @param {* index into the map} index 
 */
let removingNodes = (entry, index, hearth, addresses) => {
   let removeFromHeart = [];
   log.info('Removing a node');
   // time expired , clean up maps.
   removeFromHeart.push(entry[0]);
   let host = util.searchClientById(entry[0], addresses);
   // in case that a client is explicitly disconnected , the entry is already removed from the Map.
   // rebalance partitions when a server is removed.
   partitioner.rebalancePartitions(host.client, addresses);
   util.broadcastMessage(addresses, { type: NODE_REMOVED, msg: addresses });
   removeFromHeart.forEach(e => {
      hearth.delete(e);
   });
};

module.exports = hearthbeatCheck;
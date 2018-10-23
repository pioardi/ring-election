/**
 * This component will check periodically if some node is not sending 
 nodes from the ring.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'
let log = require('./logger');
const Rx = require('@reactivex/rxjs');
/** max time to wait for an hearthbeat(in ms) */
const maxInactiveTime = process.env.MAX_INACTIVE_TIME || 10000;
/** frequency to check if nodes are alive(in ms) */
const hearthbeatCheckFrequency = process.env.HEARTH_BEAT_CHECK_FREQUENCY || 3000;
// --------------------- HEARTH --------------------- 
/**
 * Check if some node is dead.
 */
let hearthbeatCheckLogic = function (hearth, servers) {
  if (hearth.size <= 0) {
    log.debug('No other nodes in the ring');
    setTimeout(() => {
      hearthbeatCheckLogic(hearth, servers);
    }, hearthbeatCheckFrequency)
    return;
  }
  log.debug('Doing an hearth check');
  Rx.Observable.from(hearth)
    .filter(isNodeToRemove)
    .map((entry, index) => removingNodes(entry, index, hearth, servers))
    .subscribe();
}


let hearthbeatCheck = function (hearth, servers) {
  setInterval(()=> hearthbeatCheckLogic(hearth,servers),hearthbeatCheckFrequency);
}


/**
 * Check if a node is to remove.
 * @param {map entry} entry 
 * @param {* index into the map} index 
 */
let isNodeToRemove = (entry, index) => {
  return Date.now() - entry[1] > maxInactiveTime
}
/**
 * Remove nodes from data structures.
 * @param {map entry} entry 
 * @param {* index into the map} index 
 */
let removingNodes = (entry, index, hearth, servers) => {
  let removeFromHeart = [];
  log.info('Removing a node');
  // time expired , clean up maps.
  removeFromHeart.push(entry[0]);
  let toRemove;
  servers.forEach((value1, key1, map1) => {
    if (key1.id === entry[0]) {
      toRemove = key1;
    }
  });
  servers.delete(toRemove);
  removeFromHeart.forEach(e => {
    hearth.delete(e);
  })
}

module.exports = hearthbeatCheck;
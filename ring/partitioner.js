/**
 * Default partitioner will partition data in a round robin fashion.
 * This component will rebalance partitions when a node is added or removed from the cluster.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const Rx = require('@reactivex/rxjs');
const log = require('./logger');
const util = require('./util');


/**
 * Default Partitioner is a round robin algorithm
 * @param {*} data  the data to insert.
 */
let defaultPartitioner = (data) => {
   return  hash.digest(data) % process.env.NUM_PARTITIONS;
};

/**
 * Assign all partitions to one node.
 * @param {*} numberOfPartitions 
 * @param {*} partitionsAssigned 
 * @private
 */
function assignAllPartitions(numberOfPartitions, partitionsAssigned) {
  for (var i = 0; i < numberOfPartitions; i++) {
    partitionsAssigned.push(i);
  }
}

/**
 * Update servers data structure assigning the partitions to revoke to nodes.
 * @param {*} servers 
 * @param {*} partitionsToAssignForEachNode 
 * @param {*} partitionsToRevoke 
 * @private
 */
function updateServers(servers, addresses ,partitionsToAssignForEachNode, partitionsToRevoke) {
  Rx.Observable.from(servers)
    .map((entry, index) => {
      for (let i = 0; i < partitionsToAssignForEachNode; i++) {
        let assignedPartition = partitionsToRevoke[partitionsToRevoke.length - 1];
        log.info(`Assigned partition number ${assignedPartition} to node ${entry[0].hostname}`);
        entry[1].partitions.push(partitionsToRevoke.pop());
      }
      // update addresses
      let i = addresses.findIndex(e => e.id == entry[0].id);
      if(i >= 0){
        addresses[i].partitions = entry[1].partitions;
      }
      return entry;
    })
    .subscribe();
}

/**
 * Reassign partitions across the cluster.
 * @param {*} client client added or removed.
 * @param {*} hostname hostname of client.
 * @param {*} servers all servers in the cluster.
 * @returns the partitions assigned.
 * @public
 */
let assignPartitions = (client,servers) => {
  let partitionsAssigned = [];
  let numberOfPartitions = process.env.NUM_PARTITIONS;
  let numberOfNodes = servers.size;
  let partitionsToAssign = Math.round(numberOfPartitions / (numberOfNodes + 1));
  let partitionsToRevokeForEachNode = Math.round(partitionsToAssign / numberOfNodes);
  if (servers.size > 0) {
    Rx.Observable.from(servers)
                 .flatMap((entry,index) => revokePartitions(entry,index,partitionsToRevokeForEachNode))
                 .do(p=> partitionsAssigned.push(p))
                 .subscribe();
  } else {
    // assign all partitions
    assignAllPartitions(numberOfPartitions, partitionsAssigned);
  }
  return partitionsAssigned;
};

/**
 * Revoke partitions assigned to client and split them to other nodes.
 * @param {*} client the client removed from the cluster.
 * @param {*} servers all servers in the cluster.
 * @param {*} addresses servers in the cluster.
 * @public
 * 
 */
let rebalancePartitions = (client,servers,addresses) => {
  let entry = util.searchClient(client,servers);
  // save partitions
  let partitionsToRevoke = entry[1].partitions;
  log.debug(`Client disconnected ${entry[0].hostname}`);
  // clean data structures
  servers.delete(entry[0]);
  let indexToRemove = addresses.findIndex(e=> e.id == entry[0].id);
  addresses.splice(indexToRemove,1);
  addresses.filter(e => e.priority > 1).forEach(e => e.priority--);
  let partitionsToAssignForEachNode = Math.round(partitionsToRevoke.length / servers.size);
  updateServers(servers, addresses ,  partitionsToAssignForEachNode, partitionsToRevoke);
};

/**
 * 
 * @param {*} entry 
 * @param {*} index 
 * @param {*} partitionsToRevokeForEachNode 
 * @private
 */
let revokePartitions = (entry, index,partitionsToRevokeForEachNode) => {
  return Rx.Observable.create((observer) => {
    for(let i = 0 ; i < partitionsToRevokeForEachNode ; i++ ){
      let partitions = entry[1].partitions;
      let revokedPartition = partitions[partitions.length - 1];
      log.info(`Revoked partition number ${revokedPartition} to node ${entry[0].hostname}`);
      observer.next(partitions.pop())
    }
    observer.complete();
  })
}

module.exports = {
  defaultPartitioner : defaultPartitioner,
  assignPartitions : assignPartitions,
  rebalancePartitions: rebalancePartitions
}



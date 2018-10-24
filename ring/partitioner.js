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
 */
function assignAllPartitions(numberOfPartitions, partitionsAssigned) {
  for (var i = 0; i < numberOfPartitions; i++) {
    partitionsAssigned.push(i);
  }
}

/**
 * Reassign partitions across the cluster.
 * @param {*} client client added or removed.
 * @param {*} hostname hostname of client.
 * @param {*} servers all servers in the cluster.
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
  assignPartitions : assignPartitions
}
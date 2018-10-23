/**
 * Default partitioner will partition data in a round robin fashion.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const Rx = require('@reactivex/rxjs');


/**
 * Default Partitioner is a round robin algorithm
 * @param {*} data  the data to insert.
 */
let defaultPartitioner = (data) => {
   return  hash.digest(data) % process.env.NUM_PARTITIONS;
};

/**
 * Reassign partitions across the cluster.
 * @param {*} client client added or removed.
 * @param {*} hostname hostname of client.
 * @param {*} servers all servers in the cluster.
 */
let assignPartitions = (client, hostname,servers) => {
  let partitionsAssigned = [];
  let numberOfPartitions = process.env.NUM_PARTITIONS;
  let numberOfNodes = servers.size;
  let partitionsToAssign = Math.round(numberOfPartitions / (numberOfNodes + 1));
  let partitionsToRevokeForEachNode = Math.round(partitionsToAssign / numberOfNodes);
  if (servers.size > 0) {
    Rx.Observable.from(servers)
                .flatMap((entry, index) => {
                  return Rx.Observable.create((observer) => observer.next({ entry, index }))
                                      .repeat(partitionsToRevokeForEachNode);
                })
                .map(o => {
                  //console.log(o);
                  /* let partitions = entry[1].partitions;
                    let revokedPartition = partitions[partitions.length - 1];
                    log.info(`Revoked partition number ${revokedPartition} to node ${entry[0].hostname} and assigned to ${hostname}`);
                    partitionsAssigned.push(partitions.pop()); */
                })
                .subscribe();
  } else {
    // assign all partitions
    assignAllPartitions(numberOfPartitions, partitionsAssigned);
  }
  return partitionsAssigned;
};

/**
 * Assign all partitions to one node.
 * @param {*} numberOfPartitions 
 * @param {*} partitionsAssigned 
 */
function assignAllPartitions(numberOfPartitions, partitionsAssigned) {
  for (var i = 1; i <= numberOfPartitions; i++) {
    partitionsAssigned.push(i);
  }
}

module.exports = {
  defaultPartitioner : defaultPartitioner,
  assignPartitions : assignPartitions
}


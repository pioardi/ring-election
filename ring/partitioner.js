/**
 * Default partitioner will partition data in a round robin fashion.
 * This component will rebalance partitions when a node is added or removed from the cluster.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'
const Rx = require('@reactivex/rxjs')
const log = require('./logger')
const util = require('./util')
const numberOfPartitions = process.env.NUM_PARTITIONS || 10

/**
 * Default Partitioner is a round robin algorithm
 * @param {*} data  the data to insert.
 */
const defaultPartitioner = data => {
  return Math.abs(hashCode(data) % numberOfPartitions)
}

/**
 *
 * @param {*} s a string or an object
 */
const hashCode = key => {
  var h = 0
  const s = key.toString()
  for (var i = 0; i < s.length; i++) { h = (Math.imul(31, h) + s.charCodeAt(i)) | 0 }
  return h
}

/**
 * Assign all partitions to one node.
 * @param {*} numOfPartitions
 * @param {*} partitionsAssigned
 * @private
 */
function assignAllPartitions (numOfPartitions, partitionsAssigned) {
  for (var i = 0; i < numOfPartitions; i++) {
    partitionsAssigned.push(i)
  }
}

/**
 * Update data structures assigning the partitions to revoke to nodes.
 * @param {Array} addresses
 * @param {Number} partitionsToAssignForEachNode
 * @param {Array} partitionsToRevoke
 * @private
 */
function updateServers (
  addresses,
  partitionsToAssignForEachNode,
  partitionsToRevoke
) {
  Rx.Observable.from(addresses)
    .map(entry => {
      for (let i = 0; i < partitionsToAssignForEachNode; i++) {
        const assignedPartition =
          partitionsToRevoke[partitionsToRevoke.length - 1]
        log.info(
          `Assigned partition number ${assignedPartition} to node ${
            entry.hostname
          }`
        )
        entry.partitions.push(partitionsToRevoke.pop())
      }
      // update addresses
      const i = addresses.findIndex(e => e.id === entry.id)
      if (i >= 0) {
        addresses[i].partitions = entry.partitions
      }
      return entry
    })
    .subscribe()
}

/**
 * Reassign partitions across the cluster.
 * @param {*} client client added or removed.
 * @param {Array} addresses nodes in the cluster.
 * @returns the partitions assigned.
 * @public
 */
const assignPartitions = (client, addresses) => {
  const partitionsAssigned = []
  const numberOfPartitions = process.env.NUM_PARTITIONS || 10
  const numberOfNodes = addresses.length
  const partitionsToAssign = Math.round(numberOfPartitions / (numberOfNodes + 1))
  const partitionsToRevokeForEachNode = Math.round(
    partitionsToAssign / numberOfNodes
  )
  if (addresses.length > 0) {
    Rx.Observable.from(addresses)
      .flatMap(entry => revokePartitions(entry, partitionsToRevokeForEachNode))
      .do(p => partitionsAssigned.push(p))
      .subscribe()
  } else {
    // assign all partitions
    assignAllPartitions(numberOfPartitions, partitionsAssigned)
  }
  return partitionsAssigned
}

/**
 * Revoke partitions assigned to client and split them to other nodes.
 * @param {*} client the client removed from the cluster.
 * @param {Array} addresses nodes in the cluster , optional.
 * @public
 *
 */
const rebalancePartitions = (client, addresses) => {
  const host = util.searchClient(client, addresses)
  if (host) {
    // save partitions
    const partitionsToRevoke = host.partitions
    log.debug(`Client disconnected ${host.hostname}`)
    // clean data structures
    const indexToRemove = addresses.findIndex(e => e.id === host.id)
    addresses.splice(indexToRemove, 1)
    addresses.filter(e => e.priority > 1).forEach(e => e.priority--)
    const partitionsToAssignForEachNode = Math.round(
      partitionsToRevoke.length / addresses.length
    )
    updateServers(addresses, partitionsToAssignForEachNode, partitionsToRevoke)
  }
}

/**
 *
 * @param {*} host
 * @param {*} index
 * @param {*} partitionsToRevokeForEachNode
 * @private
 */
const revokePartitions = (host, partitionsToRevokeForEachNode) => {
  return Rx.Observable.create(observer => {
    for (let i = 0; i < partitionsToRevokeForEachNode; i++) {
      const partitions = host.partitions
      const revokedPartition = partitions[partitions.length - 1]
      log.info(
        `Revoked partition number ${revokedPartition} to node ${host.hostname}`
      )
      observer.next(partitions.pop())
    }
    observer.complete()
  })
}

module.exports = {
  defaultPartitioner: defaultPartitioner,
  assignPartitions: assignPartitions,
  rebalancePartitions: rebalancePartitions
}

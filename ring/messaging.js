/**
 * Component that will send and receive additional data across the cluster with a replication factor
 * @author Alessandro Pio Ardizio
 * @since 2.0.0
 */
'use strict'
const log = require('./logger')
const net = require('net')
const { LOCAL_QUORUM_REPLICATION, QUORUM_REPLICATION, TOTAL_REPLICATION } = require('./constants')

class Replicator {
  /**
   * Constructor
   * @param {Number} peerPort , the port to listen messages
   * @param {Function} dataListener , Function to handle messages when are received
   */
  constructor (peerPort, dataListener) {
    this.peerPort = peerPort
    this.dataListener = dataListener
    this.clients = []
    this.start(peerPort)
  }

  /**
   * Start listen for connections.
   * @param {Number} peerPort port to listen connections
   */
  listen (peerPort) {
    var server = net.createServer(client => {
      client.setNoDelay(true)
      log.info(`Replicator --- New Client connected host ${JSON.stringify(client.address())}`)
      this.clients.push(client)
      // client termination handling.
      client.on('end', () => clientDisconnected.call(this, client))
      client.on('error', e => log.error(`Replicator --- client error ${e}`))
      // data received.
      client.on('data', this.dataListener)
    })
    server.listen(peerPort, function () {
      log.info('server is listening')
    })
    return server
  }

  /**
   * Method to send data across the cluster
   * @param {*Any} nodeId , the node that is sending messages
   * @param {*Any} data , data to send to other followers via socket
   * @param {*} replication , the replication factor desired for this data, you can choose a number or LOCAL_QUORUM_REPLICATION,QUORUM_REPLICATION,TOTAL_REPLICATION
   * @since 2.0.0
   */
  send (senderId, data, replication) {
    if (Number.isNaN(replication) && ![LOCAL_QUORUM_REPLICATION, QUORUM_REPLICATION, TOTAL_REPLICATION].includes(replication)) {
      throw new Error('The specified replication is not valid, choose a number or a constant !!!')
    }
    // TODO based on replication , choose nodes to send data
  }
}

const clientDisconnected = (client) => {

}

module.exports = Replicator

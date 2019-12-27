/**
 * Create a distributed ring and partition data.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

// --------------------- CONFIG ---------------------
/* This config is helpful for development and test ,in production
 * will be used environment variables
 */
const os = require('os')
const hostname = os.hostname()
const log = require('./logger')
let monitor
let leaderConnected
// --------------------- CONFIG ---------------------

const net = require('net')
const hearthbeat = require('./hearthbeat')
const Rx = require('@reactivex/rxjs')
// node id in the ring.
var id
// priority to be elegible to be a seed node.
var priority
// Assigned partitions
var assignedPartitions = []

// --------------------- CONSTANTS ---------------------
const {
  NODE_ADDED,
  NODE_REMOVED,
  WELCOME,
  HOSTNAME,
  MESSAGE_SEPARATOR
} = require('./constants')
// --------------------- CONSTANTS ---------------------

// --------------------- DS ---------------------
/** Used for reconnection when a seed node die. */
/* Addresses will be an array so that is more simple to exchange it as object during socket communication */
let addresses
// --------------------- DS ---------------------

// --------------------- CORE ---------------------
const seedNodes = process.env.SEED_NODES.split(',') || ['localhost']

const createClient = () => {
  const seedNode = detectSeedNode()

  if (!seedNode) {
    log.info(
      'Unable to connect to any node into the cluster,you will become the leader!'
    )
    startAsLeader()
    return
  }

  var client = net.connect(
    {
      host: seedNode.split(':')[0],
      port: seedNode.split(':')[1]
    },
    () => {
      leaderConnected = seedNode
      log.info(`connected to server! Leader node is ${seedNode}`)
    }
  )
  client.setNoDelay(true)
  client.on('end', e => seedEndEvent(client, e))
  // TIP: for now avoid to handle the on error event
  client.on('error', e => seedErrorEvent(client, e))
  client.on('data', data => peerMessageHandler(data, client))
  client.write(JSON.stringify({ type: HOSTNAME, msg: hostname }))
}

const startAsLeader = () => {
  monitor.close(() => {
    log.info('Closing monitoring server started previously')
    const leader = require('./leader')
    leader.createServer()
    leader.startMonitoring()
  })
}

/**
 *
 * @return the node to try to connect
 */
function detectSeedNode () {
  const seedNode = seedNodes.shift()
  log.info(`Connecting to node ${seedNode}`)
  return seedNode
}

// --------------------- CORE ---------------------

// --------------------- MESSAGING ---------------------

const peerMessageHandler = (data, client) => {
  const stringData = data.toString()
  const dataArray = stringData.split(MESSAGE_SEPARATOR)

  dataArray.forEach(e => {
    if (e.length <= 0) return
    const jsonData = JSON.parse(e)
    const type = jsonData.type
    const msg = jsonData.msg
    log.debug(`Receveid a message with type ${type}`)
    if (type === WELCOME) {
      // convert array in a map.
      addresses = jsonData.msg
      id = jsonData.id
      priority = jsonData.priority
      log.info(`Id in the ring ${id} , priority in the ring ${priority}`)
      log.info(`Assigned partitions : ${jsonData.partitions}`)
      assignedPartitions = jsonData.partitions
      hearthbeat(client, id)
    } else if (type === NODE_ADDED) {
      log.info('New node added in the cluster')
      addresses = msg
      updatePartitionAssigned()
    } else if (type === NODE_REMOVED) {
      if (priority > 1) priority--
      log.info(
        `A node was removed from the cluster , now my priority is ${priority}`
      )
      addresses = msg
      updatePartitionAssigned()
    }
    // handle all types of messages.
  })
}

const updatePartitionAssigned = () => {
  Rx.Observable.from(addresses)
    .find(a => a.id === id)
    .subscribe(e => {
      assignedPartitions = e.partitions
    })
  log.info(`New partitions assigned ${assignedPartitions}`)
}

/**
 * Seed node dead , search new seed node and connect to it.
 */
const seedNodeReconnection = () => {
  log.error('Seed node is dead')
  Rx.Observable.from(addresses)
    .find(e => e.priority === 1)
    .subscribe(
      e => {
        log.info(`Find vice seed node with address ${e.hostname}`)
        setTimeout(createClient, process.env.TIME_TO_RECONNECT || 3000)
      },
      error => log.error(error),
      () => log.info('Reconnected to seed node')
    )
}

/**
 * Handler for seed node disconnection.
 */
const seedEndEvent = (client, err) => {
  if (err) log.error(`Seed error event : ${err}`)
  log.info('seed node disconnected')
  client.end()
  client.destroy()
  // keep clients updated
  if (priority === 1) {
    log.info(
      'Becoming seed node , clearing server list and waiting for connections'
    )
    assignedPartitions = []

    setTimeout(startAsLeader, process.env.TIME_TO_BECOME_SEED || 1000)
  } else {
    seedNodeReconnection()
  }
}

/**
 * Error handling on sockets.
 * @param {*} client , client disconnected
 * @param {*} e  , error
 */
const seedErrorEvent = (client, e) => {
  log.error(JSON.stringify(e))
  createClient()
}

// --------------------- MESSAGING ---------------------
const ringInfo = () => {
  return addresses
}
const partitions = () => {
  return assignedPartitions
}

// --------------------- MONITORING ---------------------
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.get('/status', (req, res) => {
  log.info('Follower status request received')
  // return only needed info.
  const result = ringInfo().map(node => ({
    partitions: node.partitions,
    hostname: node.hostname,
    port: node.port,
    id: node.id,
    priority: node.priority
  }))
  // adding the leader connected to.
  result.push({ partitions: [], hostname: leaderConnected.split(':')[0], port: leaderConnected.split(':')[1] })
  res.send(result)
})
app.get('/partitions', (req, res) => {
  log.info('Partitions request received')
  res.send(partitions())
})

const startMonitoring = () => {
  const port = process.env.MONITORING_PORT || 9000
  monitor = app.listen(port)
  log.info(`Server is monitorable at the port ${port}`)
}

module.exports = {
  createClient: createClient,
  defaultPartitioner: require('./partitioner').defaultPartitioner,
  ring: ringInfo,
  startMonitoring: startMonitoring,
  partitions: partitions
}

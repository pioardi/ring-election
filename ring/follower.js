/**
 * Create a distributed ring and partition data.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict';

// --------------------- CONFIG ---------------------
/* This config is helpful for development and test ,in production
 * will be used environment variables
 */
let os = require('os');
let hostname = os.hostname();
let log = require('./logger');
let peerPort = process.env.PORT || 3000;
let monitor ;
// --------------------- CONFIG ---------------------

const net = require('net');
const hearthbeat = require('./hearthbeat');
const Rx = require('@reactivex/rxjs');
// node id in the ring.
var id;
// priority to be elegible to be a seed node.
var priority;
// Assigned partitions
var assignedPartitions = [];

// --------------------- CONSTANTS ---------------------
const {
  NODE_ADDED,
  NODE_REMOVED,
  WELCOME,
  HOSTNAME,
  MESSAGE_SEPARATOR
} = require('./constants');
// --------------------- CONSTANTS ---------------------

// --------------------- DS ---------------------
/** Used for reconnection when a seed node die. */
/* Addresses will be an array so that is more simple to exchange it as object during socket communication */
let addresses;
// --------------------- DS ---------------------

// --------------------- CORE ---------------------

/**
 * Simple node of the ring , it will contact seed node
 * and will sent heart beath message each 10s.
 */
let seedNodes;
if (process.env.SEED_NODES) {
  seedNodes = process.env.SEED_NODES.split(',');
  seedNodes.push('localhost');
} else {
  seedNodes = ['localhost'];
}

let createClient = () => {
  let seedNode;
  seedNode = detectSeedNode();

  var client = net.connect(
    {
      host: seedNode,
      port: peerPort
    },
    () => log.info('connected to server!')
  );
  client.setNoDelay(true);
  client.on('data', data => peerMessageHandler(data, client));
  client.on('end', e => seedErrorEvent(client, e));
  client.on('error', e => seedEndEvent(client, e, seedNode));
  client.write(JSON.stringify({ type: HOSTNAME, msg: hostname }));
  return client;
};

/**
 *
 * @return the node to try to connect
 */
function detectSeedNode() {
  let seedNode = seedNodes.shift();
  log.info(`Connecting to node ${seedNode}`);
  return seedNode;
}

// --------------------- CORE ---------------------

// --------------------- MESSAGING ---------------------

let peerMessageHandler = (data, client) => {
  let stringData = data.toString();
  let arrayData = stringData.split(MESSAGE_SEPARATOR);

  arrayData.forEach(e => {
    if (e.length <= 0) return;
    let jsonData = JSON.parse(e);
    let type = jsonData.type;
    let msg = jsonData.msg;
    log.debug(`Receveid a message with type ${type}`);
    if (type === WELCOME) {
      // convert array in a map.
      addresses = jsonData.msg;
      id = jsonData.id;
      priority = jsonData.priority;
      log.info(`Id in the ring ${id} , priority in the ring ${priority}`);
      log.info(`Assigned partitions : ${jsonData.partitions}`);
      assignedPartitions = jsonData.partitions;
      hearthbeat(client, id);
    } else if (type === NODE_ADDED) {
      log.info('New node added in the cluster');
      addresses = msg;
      updatePartitionAssigned();
    } else if (type === NODE_REMOVED) {
      if (priority > 1) priority--;
      log.info(
        `A node was removed from the cluster , now my priority is ${priority}`
      );
      addresses = msg;
      updatePartitionAssigned();
    }
    // handle all types of messages.
  });
};

let updatePartitionAssigned = () => {
  Rx.Observable.from(addresses)
    .find(a => a.id == id)
    .subscribe(e => {
      assignedPartitions = e.partitions;
    });
  log.info(`New partitions assigned ${assignedPartitions}`);
};

/**
 * Seed node dead , search new seed node and connect to it.
 */
let seedNodeReconnection = () => {
  log.error('Seed node is dead');
  Rx.Observable.from(addresses)
    .find(e => e.priority === 1)
    .subscribe(
      e => {
        log.info(
          `Find vice seed node with address ${e.hostname} and port ${e.port}`
        );
        process.env.SEED_NODES = e.hostname;
        peerPort = e.port;
        setTimeout(createClient, process.env.TIME_TO_RECONNECT || 3000);
      },
      error => log.error(error),
      () => log.info('Reconnected to seed node')
    );
};

/**
 * Handler for seed node disconnection.
 */
let seedErrorEvent = (client, err) => {
  if (err) log.error(`Seed error event : ${err}`);
  log.info('seed node disconnected');
  client.end();
  client.destroy();
  // keep clients updated
  if (priority === 1) {
    log.info(
      'Becoming seed node , clearing server list and waiting for connections'
    );
    monitor.close();
    const ring = require('./leader');
    setTimeout(ring.createServer, process.env.TIME_TO_BECOME_SEED || 1000);
  } else {
    seedNodeReconnection();
  }
};

/**
 * Error handling on sockets.
 * @param {*} client , client disconnected
 * @param {*} e  , error
 */
let seedEndEvent = (client, e, seedNode) => {
  log.error(JSON.stringify(e));
  if (seedNode != 'localhost') createClient();
};

// --------------------- MESSAGING ---------------------
let ringInfo = () => {
  return addresses;
};
let partitions = () => {
  return assignedPartitions;
};

// --------------------- MONITORING ---------------------
let express = require('express');
let app = express();
app.get('/status', (req,res) => {
    log.info('Status request received');
    res.send(ringInfo()); 
});
app.get('/partitions', (req,res) => {
  log.info('Partitions request received');
  res.send(partitions()); 
});
let port = process.env.MONITORING_PORT || 9000;
monitor = app.listen(port);
log.info(`Server is monitorable at the port ${port}`);

module.exports = {
  createClient: createClient,
  defaultPartitioner: require('./partitioner').defaultPartitioner,
  ring: ringInfo,
  partitions: partitions
};

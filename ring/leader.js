/**
 * Create a distributed ring and partition data.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict';

const partitioner = require('./partitioner');
// --------------------- CONFIG ---------------------
let log = require('./logger');
let peerPort = process.env.PORT || 3000;
// --------------------- CONFIG ---------------------

const net = require('net');
const util = require('./util');
const hearthbeatCheck = require('./hearthcheck');

// --------------------- CONSTANTS ---------------------
const {
  NODE_ADDED,
  HEARTH_BEAT,
  WELCOME,
  HOSTNAME,
  MESSAGE_SEPARATOR
} = require('./constants');
// --------------------- CONSTANTS ---------------------

// --------------------- DS ---------------------
/** mantain for each peer the last hearth beat. */
let hearth = new Map();
/** Used for reconnection when a seed node die. */
/* Addresses will be an array so that is more simple to exchange it as object during socket communication */
let addresses = [];
// --------------------- DS ---------------------

// --------------------- CORE ---------------------
/**
 * Create seed node server.
 * It will wait for client connections and will broadcast gossip info.
 */
let createServer = () => {
  log.info('Becoming leader...');
  var server = net.createServer(client => {
    client.setNoDelay(true);
    log.info(`New Client connected host ${JSON.stringify(client.address())}`);
    // client termination handling.
    client.on('end', () => clientDisconnected(client));
    client.on('error', e => log.error(`client error ${e}`));
    // data received.
    client.on('data', data => peerMessageHandler(data, client));
    // put client connection in the map , and assign partitions.
  });
  hearthbeatCheck(hearth, addresses);
  server.listen(peerPort, function() {
    log.info('server is listening');
  });
  return server;
};

let clientDisconnected = client => {
  log.info(
    `A node is removed from the cluster ${
      client.remoteAddress
    }, waiting heart check to rebalance partitions`
  );
};

// --------------------- CORE ---------------------

// --------------------- MESSAGING ---------------------

let peerMessageHandler = (data, client) => {
  let stringData = data.toString();
  let arrayData = stringData.split(MESSAGE_SEPARATOR);

  arrayData.forEach(e => {
    if (e.length <= 0) return;
    let jsonData = JSON.parse(e);
    let type = jsonData.type;
    log.debug(`Receveid a message with type ${type}`);
    let msg = jsonData.msg;
    if (type === HEARTH_BEAT) {
      hearth.set(jsonData.id, Date.now());
    } else if (type === HOSTNAME) {
      clientHostname(client, msg);
    }
    // handle all types of messages.
  });
};

/**
 *  After the server get the hostname , it will send a welcome message to the client.
 * @param {*} client client connected
 * @param {*} hostname  hostname of the client
 */
let clientHostname = (client, hostname) => {
  let priority = addresses.length + 1;
  let cliendId = generateID();
  let assignedPartitions = partitioner.assignPartitions(client, addresses);
  hearth.set(cliendId, Date.now());
  addresses.push({
    client: client,
    hostname: hostname,
    port: client.localPort,
    id: cliendId,
    partitions: assignedPartitions,
    priority: priority
  });
  let welcome = {
    type: WELCOME,
    msg: addresses,
    id: cliendId,
    priority: priority,
    partitions: assignedPartitions
  };
  // sent ring info to the new peer.
  client.write(JSON.stringify(welcome) + MESSAGE_SEPARATOR);
  util.broadcastMessage(addresses, { type: NODE_ADDED, msg: addresses });
};

// --------------------- MESSAGING ---------------------
/**
 * Return an id to be associated to a node.
 */
let generateID = () => {
  return Math.random()
    .toString(36)
    .substring(7);
};

let ringInfo = () => {
  return addresses;
};

// --------------------- MONITORING ---------------------
let express = require('express');
let app = express();
app.get('/status', (req, res) => {
  log.info('Status request received');
  res.send(ringInfo());
});

let startMonitoring = () => {
  let port = process.env.MONITORING_PORT || 9000;
  app.listen(port);
  log.info(`Server is monitorable at the port ${port}`);
};

module.exports = {
  createServer: createServer,
  defaultPartitioner: partitioner.defaultPartitioner,
  startMonitoring: startMonitoring,
  ring: ringInfo
};


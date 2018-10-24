/**
 * Create a distributed ring and partition data.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

const partitioner = require('./partitioner');
// --------------------- CONFIG --------------------- 
/* This config is helpful for development and test ,in production 
* will be used environment variables 
*/
let config = require('../config/config.js');
let configObject = require('../config/config.json');
config(configObject);
let log = require('./logger');
let peerPort = process.env.PORT || 3000;
// --------------------- CONFIG --------------------- 

const net = require('net');
const util = require('./util');
const hearthbeatCheck = require('./hearthcheck');
const Rx = require('@reactivex/rxjs');


// --------------------- CONSTANTS ---------------------
const {NODE_ADDED,NODE_REMOVED,HEARTH_BEAT,WELCOME,HOSTNAME,MESSAGE_SEPARATOR} = require('./constants'); 
// --------------------- CONSTANTS --------------------- 

// --------------------- DS --------------------- 
/** this will maintain an entry for each peer and will keep updated assigned partitions.*/
var servers = new Map();
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
  var server = net.createServer((client) => {
    client.setNoDelay(true);
    log.info(`New Client connected host ${JSON.stringify(client.address())}`);
    // client termination handling.
    client.on('end', () => clientDisconnected(client));
    client.on('error', (e) => log.error(`client error ${e}`));
    // data received.
    client.on('data', (data) => peerMessageHandler(data, client));
    // put client connection in the map , and assign partitions. 
  });
  hearthbeatCheck(hearth, servers);
  server.listen(peerPort, function () {
    log.info('server is listening');
  });
}


let clientDisconnected = (client) => {
  partitioner.rebalancePartitions(client,servers,addresses);
  // Inform other nodes that one is removed.
  broadcastMessage({type : NODE_REMOVED , msg: addresses })
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
    if (type === HEARTH_BEAT) {
      hearth.set(jsonData.id, Date.now());
    } else if (type === HOSTNAME) {
      clientHostname(client, msg);
    }
    // handle all types of messages.
  })
}

/**
*  After the server get the hostname , it will send a welcome message to the client. 
 * @param {*} client client connected
 * @param {*} hostname  hostname of the client
 */
let clientHostname = (client, hostname) => {
  let cliendId = generateID();
  let priority = addresses.length + 1;
  let assignedPartitions = partitioner.assignPartitions(client, servers);
  servers.set({ client: client, id: cliendId, hostname: hostname }, { priority: priority, partitions: assignedPartitions });
  hearth.set(cliendId, Date.now());
  addresses.push({ client: client , address: hostname, port: client.localPort, id: cliendId, partitions: assignedPartitions, priority: priority });
  let welcome = { type: WELCOME, msg: addresses, id: cliendId, priority: priority , partitions: assignedPartitions};
  // sent ring info to the new peer.
  client.write(JSON.stringify(welcome) + MESSAGE_SEPARATOR);
  broadcastMessage({type : NODE_ADDED , msg : addresses});
  
}


/**
 * Broadcast message to each node.
 * @param {*} msg , message to sent in broadcast.
 */
let broadcastMessage = (msg) => {
  if (servers.size > 0) {
    servers.forEach((value, key, map) => {
      key.client.write(JSON.stringify(msg) + MESSAGE_SEPARATOR);
    })
  }
}
// --------------------- MESSAGING --------------------- 
/**
 * Return an id to be associated to a node.
 */
let generateID = () => {
  return Math.random().toString(36).substring(7)
}
module.exports = {
  createServer: createServer,
  defaultPartitioner: partitioner,
}
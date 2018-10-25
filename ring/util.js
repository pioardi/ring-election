/**
 * Util functions to search and remove data from data structures.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

const Rx = require('@reactivex/rxjs');
const log = require('./logger');
const {MESSAGE_SEPARATOR} = require('./constants');

/**
 * Search a client by instance.
 * @param {*} id the client  to search
 * @param {*} ds a map
 * @returns the entry in the map.
 */
let searchClient = (client,ds) => {
    let result ;
    Rx.Observable.from(ds)
      .filter( (e,index) => e[0].client == client)
      .first()
      .subscribe(
          entry => result= entry,
          e => log.error(e)
      );
    return result;
}

/**
 * Search a client by client Id.
 * @param {*} priority the priority to search
 * @param {*} ds a map
 * @returns the entry in the map.
 */
let searchClientByPriority = (priority,ds) => {
    let result ;
    Rx.Observable.from(ds)
      .filter( (e,index) => e[1].priority == priority)
      .first()
      .subscribe(
          entry => result= entry,
          e => log.error(e)
      );
    return result;
}

/**
 * Search a client by client Id.
 * @param {int} id id to search
 * @param {Map} ds a map with id as keys.
 * @returns the entry in the map.
 */
let searchClientById = (id,ds) => {
    let result ;
    Rx.Observable.from(ds)
      .filter( (e,index) => e[0].id == id)
      .first()
      .subscribe(
          entry => result= entry,
          e => log.error(e)
      );
    return result;
}


/**
 * Broadcast message to each node.
 * @param {Object} msg , message to sent in broadcast.
 * @param {Map} servers , servers in the cluster.
 */
let broadcastMessage = (servers,msg) => {
    if (servers.size > 0) {
      servers.forEach((value, key, map) => {
        key.client.write(JSON.stringify(msg) + MESSAGE_SEPARATOR);
      })
    }
  }

module.exports = {
    searchClient: searchClient,
    searchClientByPriority: searchClientByPriority,
    searchClientById: searchClientById,
    broadcastMessage: broadcastMessage
}
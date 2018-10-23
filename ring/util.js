/**
 * Util functions to search and remove data from data structures.
 * @author Alessandro Pio Ardizio
 * @since 0.1
 */
'use strict'

const Rx = require('@reactivex/rxjs');
const log = require('./logger');

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
      );
    return result;
}


module.exports = {
    searchClient: searchClient,
    searchClientByPriority: searchClientByPriority
}
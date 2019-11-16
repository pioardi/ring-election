'use strict';
//ring-election_node-0_1
const expect = require('expect');
const request = require('request');
var exec = require('child_process').exec;

let shouldStartWell = (err, response, body, done, nodeNumber) => {
  expect(response.statusCode).toBe(200);
  expect(body).toBeDefined();
  let resp = JSON.parse(body);
  expect(resp.length).toBe(3);
  // actually the leader has not assigned to any partition.
  let leader = resp.find(node => node.partitions.length == 0);
  expect(leader).toBeDefined();
  // expect other two nodes to have 5 partitions assigned per each.
  resp
    .filter(node => node.partitions.length > 0)
    .forEach(n => {
      expect(n.partitions.length).toBe(5);
    });
  if (nodeNumber == 3) done();
};

let shouldReassignPartitions = (err, response, body, done, nodeNumber) => {
  expect(response.statusCode).toBe(200);
  expect(body).toBeDefined();
  let resp = JSON.parse(body);
  expect(resp.length).toBe(2);
  // actually the leader has not assigned to any partition.
  let leader = resp.find(node => node.partitions.length == 0);
  expect(leader).toBeDefined();
  // expect other node to have 10 partitions assigned per each.
  resp
    .filter(node => node.partitions.length > 0)
    .forEach(n => {
      expect(n.partitions.length).toBe(10);
    });

  // restart container
  if (nodeNumber == 2) {
    exec('docker container restart ring-election_node-2_1', err => {
      if (!err) done();
      else console.error(err);
    });
  }
};

let shouldHandleLeaderFailure = (err, response, body, done, nodeNumber) => {
  expect(response.statusCode).toBe(200);
  expect(body).toBeDefined();
  let resp = JSON.parse(body);
  expect(resp.length).toBe(2);
  // actually the leader has not assigned to any partition.
  let leader = resp.find(node => node.partitions.length == 0);
  expect(leader).toBeDefined();
  // expect other node to have 10 partitions assigned per each.
  resp
    .filter(node => node.partitions.length > 0)
    .forEach(n => {
      expect(n.partitions.length).toBe(10);
    });
  // restart container
  if (nodeNumber == 2) {
    exec('docker container restart ring-election_node-0_1', err => {
      if (!err) done();
      else console.error(err);
    });
  }
};

describe('Integration test', () => {
  it('Should start well', done => {
    request('http://localhost:9000/status', (err, resp, body) => {
      shouldStartWell(err, resp, body, done, 1);
    });
    request('http://localhost:9001/status', (err, resp, body) => {
      shouldStartWell(err, resp, body, done, 2);
    });
    request('http://localhost:9002/status', (err, resp, body) => {
      shouldStartWell(err, resp, body, done, 3);
    });
  });

  it('Should reassign partitions when a node is down', done => {
    exec('docker container stop ring-election_node-2_1', err => {
      expect(err).toBeFalsy();
      setTimeout(() => {
        request('http://localhost:9000/status', (err, resp, body) => {
          shouldReassignPartitions(err, resp, body, done, 1);
        });
        request('http://localhost:9001/status', (err, resp, body) => {
          shouldReassignPartitions(err, resp, body, done, 2);
        });
      }, 15000);
    });
  });

  it('Another node should become leader if the leader fail', done => {
    // assume that the node-0 is the leader, it should always be the leader
    exec('docker container stop ring-election_node-0_1', err => {
      expect(err).toBeFalsy();
      setTimeout(() => {
        // another node must become the leader.
        request('http://localhost:9001/status', (err, resp, body) => {
          shouldHandleLeaderFailure(err, resp, body, done, 1);
        });
        request('http://localhost:9002/status', (err, resp, body) => {
          shouldHandleLeaderFailure(err, resp, body, done, 2);
        });
        // when leader is added again , it should be a follower
        setTimeout(() => {
          request('http://localhost:9000/status', (err, resp, body) => {
            shouldReassignPartitions(err, resp, body, done);
          });
          request('http://localhost:9001/status', (err, resp, body) => {
            shouldReassignPartitions(err, resp, body, done);
          });
          request('http://localhost:9002/status', (err, resp, body) => {
            shouldReassignPartitions(err, resp, body, done);
            done();
          });
        }, 10000);
      }, 15000);
    });
  });
});

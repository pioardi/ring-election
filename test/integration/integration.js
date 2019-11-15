'use strict';
//ring-election_node-0_1
const expect = require('expect');
const request = require('request');
var exec = require('child_process').exec;

let shouldStartWell = (err, response, body , done , nodeNumber) => {
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
    if(nodeNumber == 3)
        done();
  };

describe('Integration test', () => {

  it('Should start well', done => {
    request('http://localhost:9000/status', (err,resp,body) => {
        shouldStartWell(err,resp,body,done,1);
    });
    request('http://localhost:9001/status', (err,resp,body) => {
        shouldStartWell(err,resp,body,done,2);
    });
    request('http://localhost:9002/status', (err,resp,body) => {
        shouldStartWell(err,resp,body,done,3);
    });
  });


  
  it('Should reassign partitions when a node is down', done => {
    
    exec('docker container stop ring-election_node-2_1', err => {
      expect(err).toBeFalsy();
      setTimeout(() => {
        request('http://localhost:9000/status', (err, response, body) => {
            expect(response.statusCode).toBe(200);
            expect(body).toBeDefined();
            let resp = JSON.parse(body);
            expect(resp.length).toBe(2);
            // actually the leader has not assigned to any partition.
            let leader = resp.find((node) => node.partitions.length == 0);
            expect(leader).toBeDefined();
            // expect other node to have 5 partitions assigned per each.
            resp.filter(node => node.partitions.length > 0).forEach(n => {
                expect(n.partitions.length).toBe(10);
            });
            exec('docker container restart ring-election_node-2_1', err => {
                if(!err)
                    done();
                else
                    console.error(err);
            });
        });
      }, 15000);
    });
  });
});

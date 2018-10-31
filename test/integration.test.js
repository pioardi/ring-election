const expect = require('expect');
const ring = require('../');

describe('Integration test', () => {
    
    it('One leader and two followers test', (done) => {
        // start a node as leader
        ring.leader.createServer();
        // start node as follower
        // NB You should not do this on the same host , one host should be or a leader or a follower
        // here is done only to demonstration scope.
        ring.follower.createClient();
        setTimeout(() => {
            // see all hosts in the cluster
            ring.leader.ring().forEach(node => {
                expect(node.partitions.length).toBe(10);
            });
            ring.follower.createClient();
            setTimeout(() => {
                ring.follower.ring().forEach(node => {
                    expect(node.partitions.length).toBe(5);
                });
                done();
            }, 100);
        }, 20);
    });
});

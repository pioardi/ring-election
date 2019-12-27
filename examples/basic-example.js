// process.env['NODE_ENV'] = 'dev';
const ring = require('../')

// start a node as leader
ring.leader.createServer()
// start node as follower
// NB You should start a leader and a follower on two different nodes.
// here is done only to demonstration scope.
ring.follower.createClient()

setTimeout(() => {
  // see all hosts in the cluster
  ring.leader.ring().forEach(node => {
    console.log('ONE NODE IN THE CLUSTER')
    // expect partitions to be from 0 to 9 for one node
    console.log(`Node ${node.hostname} has these partitions assigned ${node.partitions}`)
  })
  ring.follower.createClient()
  setTimeout(() => {
    console.log('TWO NODES IN THE CLUSTER')
    ring.follower.ring().forEach(node => {
      // expect partitions to be from 0 to 9 for one node
      console.log(`Node ${node.hostname} has these partitions assigned ${node.partitions}`)
    })
  }, 100)
}, 100)

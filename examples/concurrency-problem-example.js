//process.env['NODE_ENV'] = 'dev';
const ring = require('../');

// start a node as leader
ring.leader.createServer();
// start node as follower
// NB You should start a leader and a follower on two different nodes.
// here is done only to demonstration scope.
let follower = ring.follower;
follower.createClient();

setTimeout(() => {
    // see all hosts in the cluster
    ring.leader.ring().forEach(node => {
        console.log('ONE NODE IN THE CLUSTER');
        // expect partitions to be from 0 to 9 for one node
        console.log(`Node ${node.hostname} has these partitions assigned ${node.partitions}`);
    });
    ring.follower.createClient();
    setTimeout(() => {
        console.log('TWO NODES IN THE CLUSTER');
        ring.follower.ring().forEach(node => {
            // expect partitions to be from 0 to 9 for one node
            console.log(`Node ${node.hostname} has these partitions assigned ${node.partitions}`);
        });
        assumeToBeFollower1();
    }, 100);
}, 100);
// cluster creation COMPLETE 




let assumeToBeFollower1 = () => {
    // This Map simulate a more complex data storage
    let map = new Map();
    // Now suppose to be follower1
    map.set(0,[]);
    map.set(1,[]);
    map.set(2,[]);
    map.set(3,[]);
    map.set(4,[]);
    map.set(5,[]);
    map.set(6,[]);
    map.set(7,[]);
    map.set(8,[]);
    map.set(9,[]);

    // get the partition for this key , you can use another partitioner if needed.
    let partition1 = ring.follower.defaultPartitioner('key1');
    map.set(partition1, 'key1');

    // Do the same for other data
    // get the partition for this key , you can use another partitioner if needed.
    let partition2 = ring.follower.defaultPartitioner('key2');
    map.set(partition2, 'key2');
    let partition3 = ring.follower.defaultPartitioner('key3');
    map.set(partition3, 'key3');
    let partition4 = ring.follower.defaultPartitioner('key4');
    map.set(partition4, 'key4');
    let partition5 = ring.follower.defaultPartitioner('key5');
    map.set(partition5, 'key5');

    // LOG PARTITIONS
    console.log(partition1); // 8
    console.log(partition2); // 9
    console.log(partition3); // 0
    console.log(partition4); // 1
    console.log(partition5); // 2

    let assignedPartitions = follower.partitions();

    console.log(assignedPartitions);

    assignedPartitions.forEach(p => {
        // NB : In this case is a single object , but should be N items belong to one partition.
        if(map.get(p))
            console.log(`Now I can work on object with this key ${map.get(p)} that belong to this partition ${p}`);
    });
};
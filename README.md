# Ring partitioner
<h2>Overview and rationale</h2>
Distributed algorithm implemented in order to make easy data partitioning and resolve problem as concurrency.<br>
The algorithm will assign to each node one or more partitions to work with.<br>
A node will be removed if it does not send an hearth beat for a while , this process is called heart check.<br>
Each node in the ring will have an ID and a priority , if the leader node will die <br>
The node with lower priority will be elect as leader.

<h2> Configuration </h2>
 PORT : The leader will start to listen of this port , default is 3000 <br>
 TIME_TO_RECONNECT: The time to wait for a follower when he has to connect to a new leader in ms , default is 3000 <br>
HEARTH_BEAT_FREQUENCY: The frequency with which a hearth beat is performed by a follower , default is 1000 <br>
HEARTH_BEAT_CHECK_FREQUENCY: The frequency with which an hearth check is performed by a leader , default is 3000 <br>
LOG_LEVEL: Follow this https://www.npmjs.com/package/winston#logging-levels , default is info.


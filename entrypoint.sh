#!/bin/bash
if [[ $LEADER_MODE == 1 ]];then
    echo "Leader mode active"
    npm run start-leader
else
   echo "Follower mode active"
   npm run start-follower
fi
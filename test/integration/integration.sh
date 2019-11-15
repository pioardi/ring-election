#!/bin/bash

cd ..
cd ..
echo "Deleting ring election image"
docker image rm -f pioardi/ring-election:1.0
docker-compose down
docker-compose rm -f
echo "\nRebuild docker image"
docker image build -t pioardi/ring-election:1.0 .
echo "\nDocker image built , start cluster..."
docker-compose up -d
echo "Waiting"
sleep 15



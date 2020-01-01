#!/bin/bash
export NODE_ENV=dev
export PORT=3002
export MONITORING_PORT=9002
export SEED_NODES=localhost:3000,localhost:3001,localhost:3002

# you can use inspect-brk insted of inspect , if you want to debug the process from the start up 
node --inspect=localhost:9229 ../start.js
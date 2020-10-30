#!/bin/sh

# change to the current dir to be able to call this script from anywhere
cd $(dirname $0)

npm run build
cp test-env.js build/env.js
# set your ssh config:
# 
#  Host karmen-test1
#    User <username>
#    # optional proxy host
#    proxyjump karmen-gateway
scp -r build/* karmen-test1:frontend/

#!/bin/bash

cd dist
export NODE_ENV=development
#export NODE_ENV=production
node index.js $*
cd ..

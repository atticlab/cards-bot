#!/bin/bash

echo "Copying node_modules"
cp -rf /tmp/node_modules ./

node bot.js
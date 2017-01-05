#!/bin/bash

echo "Installing npm components"
npm install

echo "Creating symbolic link"
rm -rf /app/src/node_modules
cd /app/src && ln -s ../node_modules node_modules

node bot.js
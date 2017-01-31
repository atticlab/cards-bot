#!/bin/bash

echo "Copying node_modules"
cp -rf /tmp/node_modules ./

export http_proxy=''
export https_proxy=''

node bot.js
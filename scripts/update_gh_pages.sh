#!/bin/sh

prjHome=~/Developer/git-workspace/sapientia-ts

cd $prjHome

NODE_ENV=production npm run build 

rm -r docs/*
cp -r dist/* docs/

#!/bin/bash

set -e

WEB_FOLDER=$(dirname $0)/../notemarks-web/docs/
WEB_FOLDER=$(readlink -f $WEB_FOLDER)

cd $(dirname $0)

npm run build

mkdir -p $WEB_FOLDER
rm -rf $WEB_FOLDER/* $WEB_FOLDER/.[!.]* $WEB_FOLDER/..?*

cp -ar ./build/. $WEB_FOLDER/

echo notemarks.app > $WEB_FOLDER//CNAME

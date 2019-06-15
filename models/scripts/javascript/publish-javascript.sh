#!/bin/bash -e

JS_DIR=$(realpath $(dirname ${0}))

source ${JS_DIR}/../env.sh
source ${JS_DIR}/build-javascript.sh

BUILD_JS_DIR=${BUILD_DIR}/javascript

pushd ${BUILD_JS_DIR}

npm version patch
npm publish --access public

popd
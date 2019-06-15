#!/bin/bash -e

JS_DIR=$(realpath $(dirname ${0}))
ASSET_DIR=${JS_DIR}/assets
source ${JS_DIR}/../env.sh

BUILD_JS_DIR=${BUILD_DIR}/javascript
BUILD_PROTO_DIR=${BUILD_JS_DIR}/src/main/proto
INSTALL_DIR=${BASE_DIR}/desktop/packages/models
rm -Rf ${BUILD_JS_DIR}
mkdir -p ${BUILD_PROTO_DIR}

# Copy assets and sources
echo "Copying assets & sources"
cp -R ${ASSET_DIR}/* ${BUILD_JS_DIR}
cp -R ${MODELS_DIR}/src/main/proto/*.proto ${BUILD_PROTO_DIR}


echo "Starting JavaScript build"
pushd ${BUILD_JS_DIR}

echo "Installing deps"
npm i

echo "Stripping package"
./node_modules/.bin/replace  '^package.*' 'package stato;' ${BUILD_PROTO_DIR}/*
npm run bundle

rm -Rf ${INSTALL_DIR}
cp -R ${BUILD_JS_DIR} ${INSTALL_DIR}

popd
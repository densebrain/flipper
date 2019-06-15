#!/bin/bash -e

CPP_DIR=$(realpath $(dirname ${0}))
ASSET_DIR=${CPP_DIR}/assets
source ${CPP_DIR}/../env.sh

BUILD_CPP_DIR=${BUILD_DIR}/cpp
rm -Rf ${BUILD_CPP_DIR}
mkdir -p ${BUILD_CPP_DIR}

#cp -R ${ASSET_DIR}/* ${BUILD_CPP_DIR}

pushd ${BUILD_CPP_DIR}

cmake ${MODELS_DIR}
make -j$(nproc)

popd
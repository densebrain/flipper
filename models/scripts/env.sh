#!/usr/bin/env bash

PLATFORM=`uname`

SCRIPT_DIR=$(realpath $(dirname ${0}))
MODELS_DIR=$(dirname $(dirname ${SCRIPT_DIR}))
BASE_DIR=$(dirname ${MODELS_DIR})
VERSION=$(cat ${BASE_DIR}/version.txt)

PROTO_SRC_DIR=${MODELS_DIR}/src/main/proto

BUILD_DIR=${MODELS_DIR}/build
BUILD_ARTIFACT_DIR=${BUILD_DIR}/artifacts
PROTO_BUILD_DIR=${BUILD_DIR}/protobuf
PROTOC=${BASE_DIR}/.cxxpods/tools/root/bin/protoc



CMAKE=$(which cmake || true)
if [[ "${CMAKE}" == "" ]]; then
	echo "cmake is not installed"
	exit -1
fi

mkdir -p ${BUILD_ARTIFACT_DIR}

export CMAKE BASE_DIR MODELS_DIR \
    SCRIPT_DIR \
    BUILD_DIR \
    PROTOBUF_SRC \
    VERSION \
    PROTO_BUILD_DIR \
    PROTO_SRC_DIR PLATFORM

function log() {
	echo "[STATO]: ${@}"
}


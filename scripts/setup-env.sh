#!/bin/sh

set -e

main () {
  ROOT_DIR=$(dirname $(dirname "${BASH_SOURCE[0]}"))

  source "$ROOT_DIR/common/xplat/js/env-utils/setup_env_vars.sh"

  export SONAR_DIR="$ROOT_DIR/common/xplat/infinity"
  export PATH="$SONAR_DIR/node_modules/.bin:$ROOT_DIR/commonxplat/third-party/node/bin:$ROOT_DIR/common/xplat/third-party/yarn:$PATH"
}

main

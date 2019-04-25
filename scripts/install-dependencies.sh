#!/bin/sh

set -e

main () {
  ROOT_DIR=$(dirname $(dirname "${BASH_SOURCE[0]}"))
  source "$ROOT_DIR/common/xplat/sonar/scripts/setup-env.sh"

  # save current cursor location
  printf "Ensuring correct dependencies..."

  PREV_DIR="`pwd`"

  # install dependencies
  # cd "$INFINITY_DIR"
  # "$INSTALL_NODE_MODULES"

  pushd $ROOT_DIR/desktop
  # ensure electron gets installed
  node node_modules/electron/install.js

  popd
  
  # remove correct dependencies log
  printf "\r"
}

main

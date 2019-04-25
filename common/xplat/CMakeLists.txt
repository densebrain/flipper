cmake_minimum_required (VERSION 3.6.0)
project(flippercpp CXX)
set(PACKAGE_NAME      flippercpp)

# LIB SETUP DEFAULTS
set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../..)
include(${ROOT_DIR}/cmake/setup.cmake)

file(GLOB SOURCES Flipper/*.cpp)
add_library(${PACKAGE_NAME} STATIC ${SOURCES})


find_path(OPENSSL_LIBRARY libssl.a HINTS ${OPENSSL_LINK_DIRECTORIES})
SET_NATIVE_OUTPUT_DIRS(${PACKAGE_NAME})

target_link_libraries(
  ${PACKAGE_NAME}
  event
  event_extra
  event_core
  folly
  rsocket
  glog
  doubleconversion
  log
  ${OPENSSL_LINK_DIRECTORIES}/libssl.a
  ${OPENSSL_LINK_DIRECTORIES}/libcrypto.a
)

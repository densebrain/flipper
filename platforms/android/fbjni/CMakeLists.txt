#
# Copyright (c) 2014-present, Facebook, Inc.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#

cmake_minimum_required(VERSION 3.6.0)
include(${CMAKE_CURRENT_LIST_DIR}/../../../.cxxpods/cxxpods.cmake)

set(PACKAGE_NAME "statofb")
project(${PACKAGE_NAME} CXX)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../..)
include(${ROOT_DIR}/cmake/setup.cmake)

add_compile_options(
  -fno-omit-frame-pointer
  -fexceptions
  -O3
  -Wall
  -std=c++11
  -frtti
  -ffunction-sections
  -DDISABLE_CPUCAP
  -DDISABLE_XPLAT)

set(FBJNI_CXX ${CMAKE_CURRENT_LIST_DIR}/cxx)

list(
  APPEND FBJNI_HDRS
  ${FBJNI_CXX}
  ${FBJNI_CXX}/fbjni
  ${FBJNI_CXX}/fbjni/detail
  ${FBJNI_CXX}/lyra
  ${FBJNI_CXX}/../../jni-hack
)

include_directories(
  BEFORE
  ${FBJNI_HDRS}
)

file(
  GLOB FBJNI_SRC
  ${FBJNI_CXX}/fbjni/*.cpp
  ${FBJNI_CXX}/fbjni/detail/*.cpp
  ${FBJNI_CXX}/lyra/*.cpp
)

add_library(${PACKAGE_NAME} SHARED
  ${FBJNI_SRC})

SET_NATIVE_OUTPUT_DIRS(${PACKAGE_NAME})

target_include_directories(${PACKAGE_NAME} PRIVATE ${FBJNI_HDRS})

target_link_libraries(${PACKAGE_NAME} android log)

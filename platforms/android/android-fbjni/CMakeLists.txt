#
# Copyright (c) 2014-present, Facebook, Inc.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#

cmake_minimum_required(VERSION 3.10.0)

project(android-fbjni CXX)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_EXTENSIONS OFF)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../..)
include(${ROOT_DIR}/cmake/setup.cmake)
include(${ROOT_DIR}/cmake/CxxpodsArch.cmake)


#
#add_compile_options(
#  -fno-omit-frame-pointer
#  -fexceptions
#  -O3
#  -Wall
#  -std=c++11
#  -frtti
#  -ffunction-sections
#  -DDISABLE_CPUCAP
#  -DDISABLE_XPLAT)
#
set(SRC ${CMAKE_CURRENT_LIST_DIR}/src/main)
set(MODELS_INCLUDE ${ROOT_DIR}/models/build/proto/include)

include_directories(
  BEFORE
  ${SRC}/cpp
  ${SRC}/jni-hack
  ${MODELS_INCLUDE}
)

file(
  GLOB_RECURSE FILES
  LIST_DIRECTORIES false
  "${SRC}/*.cpp"
  "${SRC}/*.h"
)


add_library(${PROJECT_NAME} SHARED ${FILES})

target_link_libraries(${PROJECT_NAME} android log)

#set(OUTPUT_LIB "${PROJECT_SOURCE_DIR}/build/intermediates/cma")
get_target_property(OUTPUT_DIR ${PROJECT_NAME} LIBRARY_OUTPUT_DIRECTORY)
get_target_property(OUTPUT_NAME ${PROJECT_NAME} LIBRARY_OUTPUT_NAME)
set(OUTPUT_FILE "${OUTPUT_DIR}/${OUTPUT_FILE}")
message(STATUS "${OUTPUT_FILE},${OUTPUT_DIR},${OUTPUT_NAME}")

add_custom_command(
  TARGET ${PROJECT_NAME}
  POST_BUILD
  COMMAND cp ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}/*.so ${ROOT_DIR}/build/native/${CXXPODS_SYSTEM}/common-stato/lib
)
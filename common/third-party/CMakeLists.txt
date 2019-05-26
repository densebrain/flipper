cmake_minimum_required (VERSION 3.6.0)
project(statescpp CXX)
#set(CMAKE_VERBOSE_MAKEFILE on)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_EXTENSIONS OFF)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../..)
include(${ROOT_DIR}/cmake/setup.cmake)

add_subdirectory(${rsocket_DIR} ${rsocket_build_DIR})
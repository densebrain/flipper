cmake_minimum_required(VERSION 3.6)
add_subdirectory(${CMAKE_CURRENT_LIST_DIR}/libevent-release-2.1.9)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../../..)
include(${ROOT_DIR}/cmake/setup.cmake)


foreach(TARGET_NAME event event_extra event_core)
  SET_NATIVE_OUTPUT_DIRS(${TARGET_NAME})
endforeach()
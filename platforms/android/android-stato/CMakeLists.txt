cmake_minimum_required(VERSION 3.10.0)

project(android-stato CXX)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_EXTENSIONS OFF)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../..)
include(${ROOT_DIR}/cmake/CxxpodsArch.cmake)
include(${ROOT_DIR}/cmake/setup.cmake)


set(FBJNI_DIR ${PROJECT_SOURCE_DIR}/../android-fbjni)



GET_LIB_NAME(COMMON_LIB common-stato)

#message("HELLO ${CXXPODS_SYSTEM}/${COMMON_LIB}")
set(COMMON_STATO_ROOT "${ROOT_DIR}/build/native/${CXXPODS_SYSTEM}/${COMMON_LIB}")
set(COMMON_STATO_INCLUDE "${COMMON_STATO_ROOT}/include")
set(COMMON_STATO_LIB "${COMMON_STATO_ROOT}/lib")

include_directories(
  AFTER
  ${COMMON_STATO_INCLUDE}
  ${FBJNI_DIR}/src/main/jni-hack
  ${FBJNI_DIR}/src/main/cpp
)

link_directories(
  BEFORE
  ${COMMON_STATO_LIB}
#  <PRIVATE:>


)

file(GLOB SOURCES src/main/cpp/sonar.cpp)
#file(GLOB_RECURSE HEADERS ${COMMON_STATO_INCLUDE}/*.h)

#file(GLOB_RECURSE HEADERS /*.h ${FBJNI_DIR}/src/main/jni-hack/*.h)

add_library(${PROJECT_NAME} SHARED ${SOURCES})

#function(ADD_COMMON_INCLUDE TARGET_NAME)
#
#
#
#endfunction()

#ADD_COMMON_INCLUDE("${PROJECT_NAME}")

target_link_libraries(${PROJECT_NAME}
  ${COMMON_LIB}
  android-fbjni
  rsocket
  folly
  event
  event_extra
  event_core
  glog
  double-conversion
  log
  ssl
  crypto
  )


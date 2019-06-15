cmake_minimum_required(VERSION 3.10.0)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_EXTENSIONS OFF)


set(COMMON_DIR ${CMAKE_CURRENT_LIST_DIR}/../../common)
set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../..)
set(MODELS_DIR ${ROOT_DIR}/models)

include(${ROOT_DIR}/cmake/CxxpodsArch.cmake)
include(${ROOT_DIR}/cmake/setup.cmake)
set(MODELS_INCLUDE ${ROOT_DIR}/models/build/proto/include)

include(${MODELS_DIR}/CMakeLists.txt)

#message("HELLO ${CXXPODS_SYSTEM}/${COMMON_LIB}")
set(CXXPODS_STATO_ROOT "${ROOT_DIR}/build/native/${CXXPODS_SYSTEM}/common-stato/${COMMON_LIB}")
set(CXXPODS_STATO_INCLUDE "${CXXPODS_STATO_ROOT}/include")
set(CXXPODS_STATO_LIB "${CXXPODS_STATO_ROOT}/lib")

project(android-stato CXX)



set(FBJNI_DIR ${PROJECT_SOURCE_DIR}/../android-fbjni)
set(COMMON_STATO_SRC_DIR ${COMMON_DIR}/common-stato/src/main/cpp)

file(GLOB_RECURSE COMMON_SOURCES ${COMMON_STATO_SRC_DIR}/*.cpp)
file(GLOB_RECURSE COMMON_HEADERS ${COMMON_STATO_SRC_DIR}}/*.h)
file(GLOB SOURCES src/main/cpp/sonar.cpp)


GET_LIB_NAME(COMMON_LIB common-stato)


add_compile_options(
  -DFOLLY_HAVE_MEMRCHR
)


include_directories(
  BEFORE
#  ${COMMON_STATO_INCLUDE
  #}
  ${PROJECT_SOURCE_DIR}/src/main/cpp
  ${CXXPODS_ROOT}/include
  ${COMMON_STATO_SRC_DIR}
  ${FBJNI_DIR}/src/main/jni-hack
  ${FBJNI_DIR}/src/main/cpp
  ${MODELS_INCLUDE}
)

link_directories(
  ${CXXPODS_STATO_LIB}
)


add_library(${PROJECT_NAME} SHARED ${SOURCES} ${COMMON_SOURCES} ${COMMON_HEADERS})
add_dependencies(${PROJECT_NAME} Stato::Models)

target_link_libraries(${PROJECT_NAME}
#  ${COMMON_LIB}
  Stato::Models
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
  protobuf
  )


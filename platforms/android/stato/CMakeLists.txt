cmake_minimum_required(VERSION 3.6.0)
set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../..)
include(${ROOT_DIR}/.cxxpods/cxxpods.cmake)

project(stato CXX)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_EXTENSIONS OFF)
set(PACKAGE_NAME ${PROJECT_NAME})



include(${ROOT_DIR}/cmake/setup.cmake)



file(GLOB SOURCES src/main/cpp/sonar.cpp)

add_library(${PACKAGE_NAME} SHARED ${SOURCES})
target_link_libraries(${PACKAGE_NAME}
  statofb
  statocpp
  rsocket
  folly
  event
  event_extra
  event_core
  glog
  doubleconversion
  log
  ${OPENSSL_LINK_DIRECTORIES}/libssl.a
  ${OPENSSL_LINK_DIRECTORIES}/libcrypto.a
  )

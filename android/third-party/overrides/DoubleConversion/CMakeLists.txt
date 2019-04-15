cmake_minimum_required (VERSION 3.6.0)

PROJECT(doubleconversion CXX)
enable_language(CXX)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../../..)
include(${ROOT_DIR}/cmake/setup.cmake)

set(PACKAGE_NAME      doubleconversion)
#set(DOUBLECONVERSION_DIR  double-conversion-3.0.0/double-conversion)

include_directories(${DOUBLECONVERSION_DIR})
file(GLOB SRCFILES  ${DOUBLECONVERSION_DIR}/double-conversion/*.cc)

add_library(${PACKAGE_NAME} STATIC ${SRCFILES})
SET_NATIVE_OUTPUT_DIRS(${PACKAGE_NAME})

#install(TARGETS ${PACKAGE_NAME}  DESTINATION ./build/)
#target_link_libraries(${PACKAGE_NAME})

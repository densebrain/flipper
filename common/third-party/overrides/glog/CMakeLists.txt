cmake_minimum_required (VERSION 3.6.0)

PROJECT(glog CXX)
enable_language(CXX)
set(PACKAGE_NAME      glog)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../../..)
include(${ROOT_DIR}/cmake/setup.cmake)

set(GLOG_SRC_DIR ${CMAKE_CURRENT_LIST_DIR}/glog-0.3.5)
list(APPEND dir_list ./../)
list(APPEND dir_list ./)
list(APPEND dir_list ${GLOG_SRC_DIR}/)
list(APPEND dir_list ${GLOG_SRC_DIR}/src)
list(APPEND dir_list ${GLOG_SRC_DIR}/glog)
list(APPEND dir_list ${GLOG_SRC_DIR}/base)

include_directories(${dir_list})

add_compile_options(
  -std=c++11
  -Wno-macro-redefined
  -Wno-macro-redefined
  -Wall
  -Wwrite-strings
  -Woverloaded-virtual
  -Wno-sign-compare
  -DNDEBUG
  -g
  -O2
  -D_START_GOOGLE_NAMESPACE_="namespace google {"
  -D_END_GOOGLE_NAMESPACE_="}"
)

list(APPEND src_files ${GLOG_SRC_DIR}/src/demangle.cc
  ${GLOG_SRC_DIR}/src/logging.cc
  ${GLOG_SRC_DIR}/src/raw_logging.cc
  ${GLOG_SRC_DIR}/src/signalhandler.cc
  ${GLOG_SRC_DIR}/src/symbolize.cc
  ${GLOG_SRC_DIR}/src/utilities.cc
  ${GLOG_SRC_DIR}/src/vlog_is_on.cc
  )

add_library(${PACKAGE_NAME} STATIC ${src_files})
SET_NATIVE_OUTPUT_DIRS(${PACKAGE_NAME})

#install(TARGETS ${PACKAGE_NAME}  DESTINATION ./build/)
target_link_libraries(${PACKAGE_NAME})

cmake_minimum_required (VERSION 3.10.0)


project(common-stato)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS ON)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../..)
include(${ROOT_DIR}/cmake/setup.cmake)
include(${ROOT_DIR}/cmake/CxxpodsArch.cmake)


# CREATE LIB
set(SRC_DIR ${PROJECT_SOURCE_DIR}/src/main/cpp)
file(GLOB_RECURSE SOURCES ${SRC_DIR}/*.cpp)
file(GLOB_RECURSE HEADERS ${SRC_DIR}/*.h)


# ENV
GET_LIB_NAME(LIB_NAME ${PROJECT_NAME})
message(STATUS "Project target: ${LIB_NAME}")
add_library(${LIB_NAME} STATIC ${SOURCES} ${HEADERS})

set(ANDROID_LIBS log)
if (ANDROID)
  set(PLATFORM_LIBS ${ANDROID_LIBS})
endif()


include_directories(
  BEFORE
  ${SRC_DIR}
)

# LINK
target_link_libraries(
  ${LIB_NAME}

  rsocket
  folly

  glog
  double-conversion
  event
  event_extra
  event_core

  ssl
  crypto

  ${PLATFORM_LIBS}
#  folly
#  rsocket
#  glog
#  double-conversion
#  log
#  event
#  event_extra
#  event_core
#





)

# INSTALL
install (TARGETS ${LIB_NAME}
  RUNTIME DESTINATION bin
  PUBLIC_HEADER DESTINATION include
  LIBRARY DESTINATION lib
  ARCHIVE DESTINATION lib
  )

install(
  DIRECTORY ${SRC_DIR}/
  DESTINATION include
  FILES_MATCHING PATTERN "*.h"
)

#install(FILES ${HEADERS} DESTINATION include/stato)


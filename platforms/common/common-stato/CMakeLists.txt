cmake_minimum_required (VERSION 3.10.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS ON)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../..)
if(NOT MODELS_DIR)
  set(MODELS_DIR ${ROOT_DIR}/models)
endif()
include(${ROOT_DIR}/cmake/setup.cmake)
include(${ROOT_DIR}/cmake/CxxpodsArch.cmake)

# set(CMAKE_CXX_STANDARD 17)
# set(CMAKE_CXX_EXTENSIONS ON)

# CREATE LIB
set(SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp)

message(STATUS "STATO BUILD TYPE: ${CMAKE_BUILD_TYPE}")


#add_subdirectory(${MODELS_DIR})
add_subdirectory(${SRC_DIR})

if (CMAKE_BUILD_TYPE STREQUAL Debug)
  SET(CMAKE_CXX_FLAGS -g3 -O0)
  SET(CMAKE_C_FLAGS -g3 -O0)
  add_compile_options(
    -g3 -O0
  )
endif()
cmake_minimum_required(VERSION 3.10.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS ON)


#include(${ROOT_DIR}/cmake/setup.cmake)
#include(${ROOT_DIR}/cmake/CxxpodsArch.cmake)
if(NOT ROOT_DIR)
  execute_process(
    COMMAND realpath ${CMAKE_CURRENT_SOURCE_DIR}
    OUTPUT_VARIABLE REAL_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
    ERROR_STRIP_TRAILING_WHITESPACE
  )

  set(ROOT_DIR ${REAL_DIR}/..)
endif()


include(${ROOT_DIR}/.cxxpods/cxxpods.cmake)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS ON)

set(MOD_VERSION 1.0)
project(stato-models VERSION ${MOD_VERSION})

option(BUILD_SHARED_LIBS "Shared or Static" OFF)

set(LIB_TYPE STATIC)
if (BUILD_SHARED_LIBS)
  set(LIB_TYPE SHARED)
endif()

# FIND PROTOBUF PACKAGE & TOOL
find_package(Protobuf REQUIRED)
find_tool(Protobuf REQUIRED)

set(MOD_PREFIX StatoModels)
set(MOD_ALIAS Models)

# SETUP DIRECTORIES
set(PROTO_SRC_DIR ${CMAKE_CURRENT_LIST_DIR}/src/main/proto)
set(PROTO_GEN_DIR ${PROJECT_SOURCE_DIR}/build/proto/generated)
set(PROTO_INCLUDE_DIR ${PROJECT_SOURCE_DIR}/build/proto/include/stato-models)

# FIND ALL THE PROTOBUFS
file(GLOB_RECURSE PROTO_SRCS ${PROTO_SRC_DIR}/**.proto)
string(REPLACE ".proto" ".pb.h" PROTO_HEADER_SRCS "${PROTO_SRCS}")
string(REPLACE "${PROTO_SRC_DIR}" "${PROTO_GEN_DIR}" PROTO_HEADER_SRCS "${PROTO_HEADER_SRCS}")

protoc(${PROTO_GEN_DIR} PROTO_CPP_SRC ${PROTO_SRCS})

add_library(${PROJECT_NAME} ${LIB_TYPE} ${PROTO_CPP_SRC})
add_library(Stato::Models ALIAS ${PROJECT_NAME})
add_custom_command(
  TARGET ${PROJECT_NAME}
  POST_BUILD
  COMMAND mkdir -p ${PROTO_INCLUDE_DIR} && cp -R ${PROTO_GEN_DIR}/* ${PROTO_INCLUDE_DIR}
  )

target_include_directories(${PROJECT_NAME}
  PUBLIC
    $<INSTALL_INTERFACE:include>
    $<BUILD_INTERFACE:${PROTO_GEN_DIR}>
)
target_link_libraries(${PROJECT_NAME}
  PUBLIC
    ${Protobuf_LIBRARIES}
)

# SETUP INSTALL
include(GNUInstallDirs)
set(INSTALL_CONFIGDIR ${CMAKE_INSTALL_LIBDIR}/cmake/${MOD_PREFIX})

install(TARGETS ${PROJECT_NAME}
  EXPORT ${PROJECT_NAME}-targets
  LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
  ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
  )

#This is required so that the exported target has the name JSONUtils and not jsonutils
set_target_properties(${PROJECT_NAME} PROPERTIES EXPORT_NAME ${MOD_ALIAS})

install(FILES ${PROTO_HEADER_SRCS} DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/stato-models)

#Export the targets to a script
install(EXPORT ${PROJECT_NAME}-targets
  FILE
    ${MOD_PREFIX}Targets.cmake
  NAMESPACE
    Stato::
  DESTINATION
    ${INSTALL_CONFIGDIR}
  )


include(CMakePackageConfigHelpers)
write_basic_package_version_file(
  ${CMAKE_CURRENT_BINARY_DIR}/${MOD_PREFIX}ConfigVersion.cmake
  VERSION ${PROJECT_VERSION}
  COMPATIBILITY AnyNewerVersion
)

configure_package_config_file(${CMAKE_CURRENT_LIST_DIR}/cmake/${MOD_PREFIX}Config.cmake.in
  ${CMAKE_CURRENT_BINARY_DIR}/${MOD_PREFIX}Config.cmake
  INSTALL_DESTINATION ${INSTALL_CONFIGDIR}
  )

#Install the config, configversion and custom find modules
install(FILES
  ${CMAKE_CURRENT_BINARY_DIR}/${MOD_PREFIX}Config.cmake
  ${CMAKE_CURRENT_BINARY_DIR}/${MOD_PREFIX}ConfigVersion.cmake
  DESTINATION ${INSTALL_CONFIGDIR}
  )

export(EXPORT ${PROJECT_NAME}-targets FILE ${CMAKE_CURRENT_BINARY_DIR}/${MOD_PREFIX}Targets.cmake NAMESPACE Stato::)

export(PACKAGE Stato)

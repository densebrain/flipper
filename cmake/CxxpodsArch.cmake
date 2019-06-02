set(CXXPODS_SYSTEM_TYPES "arm_android;aarch64_android;arm_ios;aarch64_ios" CACHE STRING "" FORCE)

if(NOT CXXPODS_SYSTEM)
  if(ANDROID_ABI STREQUAL armeabi-v7a)
    set(CXXPODS_SYSTEM arm_android)
  elseif(ANDROID_ABI STREQUAL arm64-v8a)
    set(CXXPODS_SYSTEM aarch64_android)
  else()
    message(STATUS "Trying to detect CXXPODS_SYSTEM")
    string(TOLOWER "${CMAKE_SYSTEM_NAME}" CXXPODS_SYSTEM_NAME)
    string(REPLACE "-" "_" CXXPODS_SYSTEM "${CMAKE_SYSTEM_PROCESSOR}-${CXXPODS_SYSTEM_NAME}")
  endif()
endif()


list(FIND CXXPODS_SYSTEM_TYPES ${CXXPODS_SYSTEM} CXXPODS_SYSTEM_TYPE_FOUND)
if(${CXXPODS_SYSTEM_TYPE_FOUND} EQUAL -1)
  message(FATAL_ERROR "Unknown build type ${ANDROID_ABI}/${CMAKE_BUILD_TYPE}/${CMAKE_SYSTEM_PROCESSOR}/${CMAKE_SYSTEM_NAME}, valid values are: ${CXXPODS_SYSTEM_TYPES}")
#  set(CXXPODS_SYSTEM arm_android)
#  message(STATUS "Setting default system type: ${CXXPODS_SYSTEM}")

endif()

set(CXXPODS_ROOT "${CMAKE_CURRENT_LIST_DIR}/../.cxxpods/${CXXPODS_SYSTEM}/root")
string(REPLACE "_" "-" CXXPODS_ROOT ${CXXPODS_ROOT})
message(STATUS "CXXPODS_ROOT: ${CXXPODS_ROOT}")
include_directories(
  "${CXXPODS_ROOT}/include"
  BEFORE
)

link_directories(
  ${CXXPODS_ROOT}/lib
)

list(INSERT CMAKE_MODULE_PATH 0 "${CXXPODS_ROOT}/lib/cmake")
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CXXPODS_ROOT}/lib/cmake" CACHE STRING "Modules for CMake" FORCE)
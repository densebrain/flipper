set(CXXPODS_SYSTEM_TYPES "x86_64-darwin;x86_android;arm_android;aarch64_android;arm_ios;aarch64_ios" CACHE STRING "" FORCE)

#set(CXXPODS_CONFIG)
if(NOT CXXPODS_CONFIG OR NOT CXXPODS_SYSTEM)
  if(CXXPODS_SYSTEM)
    string(REGEX REPLACE "_([a-zA-Z0-9]+)$" "-\\1" CXXPODS_CONFIG "${CXXPODS_SYSTEM}")
  else()
    if(ANDROID_ABI STREQUAL x86)
      set(CXXPODS_SYSTEM x86_android)
      set(CXXPODS_CONFIG x86-android)
    elseif(ANDROID_ABI STREQUAL armeabi-v7a)
      set(CXXPODS_SYSTEM arm_android)
      set(CXXPODS_CONFIG arm-android)
    elseif(ANDROID_ABI STREQUAL arm64-v8a)
      set(CXXPODS_SYSTEM aarch64_android)
      set(CXXPODS_CONFIG aarch64-android)
    else()
      message(STATUS "Trying to detect CXXPODS_SYSTEM")
      string(TOLOWER "${CMAKE_SYSTEM_NAME}" CXXPODS_SYSTEM_NAME)
      string(REPLACE "-" "_" CXXPODS_SYSTEM "${CMAKE_SYSTEM_PROCESSOR}-${CXXPODS_SYSTEM_NAME}")
      set(CXXPODS_CONFIG "${CMAKE_SYSTEM_PROCESSOR}-${CXXPODS_SYSTEM_NAME}")
    endif()
  endif()
endif()



list(FIND CXXPODS_SYSTEM_TYPES ${CXXPODS_SYSTEM} CXXPODS_SYSTEM_TYPE_FOUND)
if(${CXXPODS_SYSTEM_TYPE_FOUND} EQUAL -1)
  message(FATAL_ERROR "Unknown build type ${ANDROID_ABI}/${CMAKE_BUILD_TYPE}/${CMAKE_SYSTEM_PROCESSOR}/${CMAKE_SYSTEM_NAME}, valid values are: ${CXXPODS_SYSTEM_TYPES}")
#  set(CXXPODS_SYSTEM arm_android)
#  message(STATUS "Setting default system type: ${CXXPODS_SYSTEM}")

endif()

set(CXXPODS_ROOT "${CMAKE_CURRENT_LIST_DIR}/../.cxxpods/${CXXPODS_CONFIG}/root")
message(STATUS "CXXPODS_ROOT: ${CXXPODS_ROOT}")
include_directories(
  BEFORE
  "${CXXPODS_ROOT}/include"

)

link_directories(
  ${CXXPODS_ROOT}/lib
)

list(INSERT CMAKE_MODULE_PATH 0 "${CXXPODS_ROOT}/lib/cmake")
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CXXPODS_ROOT}/lib/cmake" CACHE STRING "Modules for CMake" FORCE)
##
#  With external toolchains, something it's difficult
#  to properly find android cmake modules
#
#  #include(AndroidNdkModules)
#
##
if (ANDROID)
if(ANDROID AND NOT CMAKE_SYSTEM_VERSION)
  set(CMAKE_SYSTEM_VERSION 14)
endif()

execute_process(
  COMMAND ${CMAKE_CURRENT_LIST_DIR}/android-module-path.sh
  OUTPUT_VARIABLE ANDROID_CMAKE_PATH
)


string(REPLACE "\n" "" ANDROID_CMAKE_PATH "${ANDROID_CMAKE_PATH}")

list(INSERT CMAKE_MODULE_PATH 0 "${ANDROID_CMAKE_PATH}")

message(STATUS "Android CMake Module Path: \"${ANDROID_CMAKE_PATH}\"")
include(${ANDROID_CMAKE_PATH}/Modules/AndroidNdkModules.cmake)
endif()
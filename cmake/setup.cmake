set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/..)

include(${CMAKE_CURRENT_LIST_DIR}/AndroidSetup.cmake)
include(${CMAKE_CURRENT_LIST_DIR}/Cache.cmake)
include(${CMAKE_CURRENT_LIST_DIR}/Macros.cmake)

# GLOBAL COMPILER OPTIONS
if(NOT CMAKE_CXX_STANDARD STREQUAL "17")
  set(CMAKE_CXX_STANDARD 14)
  set(CMAKE_CXX_EXTENSIONS OFF)
endif()

set(ANDROID_FLAGS -DFOLLY_HAVE_MEMRCHR)
set(IOS_FLAGS "")

if(ANDROID)
  set(PLATFORM_FLAGS ${ANDROID_FLAGS})
else()
  set(PLATFORM_FLAGS ${IOS_FLAGS})
endif()

set(
  FOLLY_FLAGS
  -DFOLLY_NO_CONFIG
  -DFOLLY_MOBILE=1
  -DFOLLY_USE_LIBCPP=1
  -DFOLLY_HAVE_LIBJEMALLOC=0
  -DFOLLY_HAVE_PREADV=0
)

set(
  SONAR_FLAGS
  -DSONAR_JNI_EXTERNAL=1
  -DFB_SONARKIT_ENABLED=1
)

add_compile_options(
  ${PLATFORM_FLAGS}
  ${FOLLY_FLAGS}
  ${SONAR_FLAGS}

  # TODO: Remove the following flag - investigate first
  -DSTATO_OSS=1

  -frtti
  -fexceptions
  -Wno-error
  -Wno-error=format-security
  -Wno-unused-local-typedefs
  -Wno-unused-variable
  -Wno-sign-compare
  -Wno-comment
  -Wno-return-type
  -Wno-tautological-constant-compare
)


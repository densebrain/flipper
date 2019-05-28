set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/..)

include(AndroidNdkModules)

# CCACHE
find_program(CCACHE_PROGRAM ccache)
if(CCACHE_PROGRAM)
  set(CMAKE_CXX_COMPILER_LAUNCHER "${CCACHE_PROGRAM}")
endif()


set(RSOCKET_VERSION 0.10.3)

set(LIBJNIHACK_DIR ${ROOT_DIR}/platforms/android/jni-hack)
set(LIBFBJNI_DIR ${ROOT_DIR}/platforms/android/fbjni)
set(LIBSTATES_DIR ${ROOT_DIR}/common/xplat)

set(NATIVE_BUILD_DIR ${ROOT_DIR}/build/native)
set(EXTERNAL_DIR ${ROOT_DIR}/common/third-party/external)

set(LIBFOLLY_DIR ${EXTERNAL_DIR}/folly)
set(LIBFOLLY_BUILD_DIR ${NATIVE_BUILD_DIR}/folly/${ANDROID_ABI})

set(FOLLY_DIR ${LIBFOLLY_DIR})
set(FOLLY_SRC_DIR ${LIBFOLLY_DIR}/folly)


set(rsocket_DIR ${EXTERNAL_DIR}/RSocket)
set(rsocket_build_DIR ${NATIVE_BUILD_DIR}/rsocket/${ANDROID_ABI})

set(easywsclient_DIR ${ROOT_DIR}/libs)

set(GLOG_DIR ${EXTERNAL_DIR}/glog)
set(GLOG_BUILD_DIR ${NATIVE_BUILD_DIR}/glog/${ANDROID_ABI})

set(BOOST_DIR ${EXTERNAL_DIR}/boost/boost_1_63_0)
set(LIBEVENT_DIR ${EXTERNAL_DIR}/LibEvent/libevent-release-2.1.9)
set(LIBEVENT_BUILD_DIR ${NATIVE_BUILD_DIR}/libevent/${ANDROID_ABI})

set(DOUBLECONVERSION_DIR ${EXTERNAL_DIR}/double-conversion/double-conversion-3.0.0)
set(DOUBLECONVERSION_BUILD_DIR ${NATIVE_BUILD_DIR}/double-conversion/${ANDROID_ABI})

set(OPENSSL_ROOT_DIR ${EXTERNAL_DIR}/OpenSSL/)
set(OPENSSL_DIR ${OPENSSL_ROOT_DIR}/openssl-1.1.0h/)
set(OPENSSL_LINK_DIRECTORIES ${OPENSSL_ROOT_DIR}/libs/${ANDROID_ABI}/)

set(RSOCKET_ROOT_DIR ${EXTERNAL_DIR}/RSocket/rsocket-cpp-${RSOCKET_VERSION})
set(RSOCKET_DIR ${RSOCKET_ROOT_DIR}/rsocket)


set(NATIVE_LIBS statofb statocpp fbjni folly rsocket glog event event_extra event_core doubleconversion)

foreach (NATIVE_LIB ${NATIVE_LIBS})
  list(APPEND NATIVE_BUILD_DIRS ${NATIVE_BUILD_DIR}/${NATIVE_LIB}/${ANDROID_ABI})
endforeach ()


# GLOBAL COMPILER OPTIONS
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_EXTENSIONS OFF)
#set(CMAKE_VERBOSE_MAKEFILE on)
add_compile_options(
  -DSTATES_OSS=1
  -DFOLLY_NO_CONFIG
  -DSONAR_JNI_EXTERNAL=1
  -DFB_SONARKIT_ENABLED=1
  -DFOLLY_HAVE_MEMRCHR
  -DFOLLY_MOBILE=1
  -DFOLLY_USE_LIBCPP=1
  -DFOLLY_HAVE_LIBJEMALLOC=0
  -DFOLLY_HAVE_PREADV=0
  -frtti
  -fexceptions
  -Wno-unused-local-typedefs
  -Wno-unused-variable
  -Wno-sign-compare
  -Wno-comment
  -Wno-return-type
  -Wno-tautological-constant-compare
)

#-Wno-error
#-Wno-error=format-security


link_directories(
  BEFORE
  ${OPENSSL_LINK_DIRECTORIES}
  ${NATIVE_BUILD_DIRS}
)

message(INFO "Link dirs: ${NATIVE_BUILD_DIRS}")

#set(RSOCKET_DIR  ${RSOCKET_ROOT_DIR}/folly)

file(MAKE_DIRECTORY ${NATIVE_BUILD_DIR})

#${ANDROID_NDK}/sources/cxx-stl/llvm-libc++/include
include_directories(
  BEFORE

  ${EXTERNAL_DIR}
  ${LIBFOLLY_DIR}
  ${BOOST_DIR}

  ${rsocket_DIR}/rsocket-cpp-${RSOCKET_VERSION}
  ${LIBEVENT_DIR}/include
  ${OPENSSL_DIR}/include
  ${GLOG_DIR}
  ${GLOG_DIR}/glog-0.3.5/src
  ${DOUBLECONVERSION_DIR}
  ${LIBSTATES_DIR}
  ${LIBJNIHACK_DIR}
  ${LIBFBJNI_DIR}/cxx/
  ${LIBFBJNI_DIR}/cxx/fbjni
  ${LIBFBJNI_DIR}/cxx/fbjni/detail
  ${LIBFBJNI_DIR}/cxx/lyra
)

macro(SET_OUTPUT_DIRS)
  set(TMP_OUTPUT_DIR ${NATIVE_BUILD_DIR}/${PKG_NAME}/${ANDROID_ABI})
  set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR})
  set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR})
  set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR})
endmacro()

macro(SET_NATIVE_OUTPUT_DIRS PKG_NAME)
  set(TMP_OUTPUT_DIR ${NATIVE_BUILD_DIR}/${PKG_NAME}/${ANDROID_ABI})
  file(MAKE_DIRECTORY ${NATIVE_BUILD_DIR})
  message(INFO "Setting target ${PKG_NAME} to output: ${TMP_OUTPUT_DIR}")
  install(TARGETS ${PACKAGE_NAME} DESTINATION ${TMP_OUTPUT_DIR})
  set_target_properties(${PKG_NAME}
    PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR}
    RUNTIME_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR}
  )
  #  set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR})
  #  set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR})
  #  set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${TMP_OUTPUT_DIR})
endmacro()
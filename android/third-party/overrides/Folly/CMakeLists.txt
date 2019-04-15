cmake_minimum_required (VERSION 3.6.0)

PROJECT(folly CXX)
enable_language(CXX)
set(PACKAGE_NAME      folly)
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_EXTENSIONS OFF)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../../../..)
include(${ROOT_DIR}/cmake/setup.cmake)

list(APPEND dir_list ./)
list(APPEND dir_list ${FOLLY_SRC_DIR}/lang)
list(APPEND dir_list ${FOLLY_SRC_DIR}/hash/)
list(APPEND dir_list ${FOLLY_SRC_DIR}/detail)
list(APPEND dir_list ${FOLLY_SRC_DIR}/memory/detail)

list(APPEND dir_list ${BOOST_DIR})
list(APPEND dir_list ${BOOST_DIR}/../)
list(APPEND dir_list ${LIBEVENT_DIR}/)
list(APPEND dir_list ${LIBEVENT_DIR}/include/)
list(APPEND dir_list ${OPENSSL_DIR}/include/)

include_directories(
  BEFORE

  ${dir_list}
)

add_compile_options(
  -DFOLLY_HAVE_CLOCK_GETTIME=1
  -DFOLLY_HAVE_PTHREAD=1
  -DFOLLY_NO_CONFIG=1
  -DFOLLY_HAVE_MEMRCHR
  -DFOLLY_MOBILE=1
  -DFOLLY_USE_LIBCPP=1
  -DFOLLY_HAVE_LIBJEMALLOC=0
  -DFOLLY_HAVE_PREADV=0
  -frtti
  -fexceptions
  -Wno-error
  -Wno-unused-local-typedefs
  -Wno-unused-variable
  -Wno-sign-compare
  -Wno-comment
  -Wno-return-type
  -Wno-tautological-constant-compare
)

if (CMAKE_ANDROID_ARCH_ABI STREQUAL "x86_64")
  add_compile_options(-mpclmul)
endif()

file(GLOB SRC_FILES ${FOLLY_SRC_DIR}/portability/*.cpp
  ${FOLLY_SRC_DIR}/io/async/ssl/*.cpp
  ${FOLLY_SRC_DIR}/io/async/*.cpp
  ${FOLLY_SRC_DIR}/detail/*.cpp
  ${FOLLY_SRC_DIR}/synchronization/*.cpp
  ${FOLLY_SRC_DIR}/lang/*.cpp
  ${FOLLY_SRC_DIR}/hash/*.cpp
  ${FOLLY_SRC_DIR}/hash/detail/*.cpp
  ${FOLLY_SRC_DIR}/memory/*.cpp
  ${FOLLY_SRC_DIR}/futures/*.cpp
  ${FOLLY_SRC_DIR}/futures/detail/*.cpp
  ${FOLLY_SRC_DIR}/experimental/hazptr/*.cpp
  ${FOLLY_SRC_DIR}/executors/*.cpp
  ${FOLLY_SRC_DIR}/concurrency/*.cpp
  ${FOLLY_SRC_DIR}/ssl/*.cpp
  ${FOLLY_SRC_DIR}/ssl/detail/*.cpp
  )
list(APPEND SRC_FILES ${FOLLY_SRC_DIR}/io/async/HHWheelTimer.cpp
  ${FOLLY_SRC_DIR}/io/async/AsyncPipe.cpp
  ${FOLLY_SRC_DIR}/io/async/AsyncTimeout.cpp
  ${FOLLY_SRC_DIR}/io/async/EventBaseManager.cpp
  ${FOLLY_SRC_DIR}/io/async/TimeoutManager.cpp
  ${FOLLY_SRC_DIR}/io/async/AsyncSocketException.cpp
  ${FOLLY_SRC_DIR}/io/async/Request.cpp
  ${FOLLY_SRC_DIR}/io/async/EventBase.cpp
  ${FOLLY_SRC_DIR}/io/async/EventHandler.cpp
  ${FOLLY_SRC_DIR}/io/async/VirtualEventBase.cpp
  ${FOLLY_SRC_DIR}/io/ShutdownSocketSet.cpp
  ${FOLLY_SRC_DIR}/SharedMutex.cpp
  ${FOLLY_SRC_DIR}/ExceptionWrapper.cpp
  ${FOLLY_SRC_DIR}/system/ThreadName.cpp
  ${FOLLY_SRC_DIR}/io/IOBuf.cpp
  ${FOLLY_SRC_DIR}/io/IOBufQueue.cpp
  ${FOLLY_SRC_DIR}/File.cpp
  ${FOLLY_SRC_DIR}/Random.cpp
  ${FOLLY_SRC_DIR}/Singleton.cpp
  ${FOLLY_SRC_DIR}/IPAddress.cpp
  ${FOLLY_SRC_DIR}/IPAddressV4.cpp
  ${FOLLY_SRC_DIR}/IPAddressV6.cpp
  ${FOLLY_SRC_DIR}/MacAddress.cpp
  ${FOLLY_SRC_DIR}/SocketAddress.cpp
  ${FOLLY_SRC_DIR}/Executor.cpp
  ${FOLLY_SRC_DIR}/FileUtil.cpp
  ${FOLLY_SRC_DIR}/lang/ColdClass.cpp
  ${FOLLY_SRC_DIR}/lang/Assume.cpp
  ${FOLLY_SRC_DIR}/json.cpp
  ${FOLLY_SRC_DIR}/Unicode.cpp
  ${FOLLY_SRC_DIR}/Conv.cpp
  ${FOLLY_SRC_DIR}/Demangle.cpp
  ${FOLLY_SRC_DIR}/memory/detail/MallocImpl.cpp
  ${FOLLY_SRC_DIR}/String.cpp
  ${FOLLY_SRC_DIR}/dynamic.cpp
  ${FOLLY_SRC_DIR}/ScopeGuard.cpp
  ${FOLLY_SRC_DIR}/json_pointer.cpp
  ${FOLLY_SRC_DIR}/Format.cpp
  ${FOLLY_SRC_DIR}/String.cpp
  ${FOLLY_SRC_DIR}/memory/detail/MallocImpl.cpp
  )

add_library(${PACKAGE_NAME} STATIC ${SRC_FILES})

#set(build_DIR ${CMAKE_SOURCE_DIR}/build)

#set(libGLOG_BUILD_DIR ${build_DIR}/libglog/${ANDROID_ABI})
#set(doubleconversion_build_DIR ${build_DIR}/doubleconversion/${ANDROID_ABI})
#set(libevent_build_DIR ${build_DIR}/libevent/${ANDROID_ABI})


#file(MAKE_DIRECTORY ${build_DIR})

#add_subdirectory(${GLOG_DIR} ${libGLOG_BUILD_DIR})
#add_subdirectory(${DOUBLECONVERSION_DIR} ${doubleconversion_build_DIR})
#add_subdirectory(${LIBEVENT_DIR} ${libevent_build_DIR})

#target_include_directories(${PACKAGE_NAME} PRIVATE
#  ${OPENSSL_DIR}/include/
#  ${BOOST_DIR}
#  ${BOOST_DIR}/../
#  ${GLOG_DIR}/../
#  ${GLOG_SRC_DIR}/src/
#  ${DOUBLECONVERSION_DIR})


#set(OPENSSL_LINK_DIRECTORIES ${PROJECT_SOURCE_DIR}/../OpenSSL/libs/${ANDROID_ABI}/)
find_path(OPENSSL_LIBRARY libssl.a HINTS ${OPENSSL_LINK_DIRECTORIES})


SET_NATIVE_OUTPUT_DIRS(${PACKAGE_NAME})

#install(TARGETS ${PACKAGE_NAME}  DESTINATION ./build/)

target_link_libraries(${PACKAGE_NAME} glog double-conversion ${OPENSSL_LINK_DIRECTORIES}/libssl.a ${OPENSSL_LINK_DIRECTORIES}/libcrypto.a event event_extra event_core)

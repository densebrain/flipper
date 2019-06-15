

project(common-stato)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_EXTENSIONS ON)

file(GLOB_RECURSE SOURCES ${PROJECT_SOURCE_DIR}/*.cpp)
file(GLOB_RECURSE HEADERS ${PROJECT_SOURCE_DIR}}/*.h)



# ENV
GET_LIB_NAME(LIB_NAME ${PROJECT_NAME})
message(STATUS "Project target: ${LIB_NAME}")

add_library(${LIB_NAME} SHARED ${SOURCES} ${HEADERS})
add_library(${LIB_NAME}_static STATIC ${SOURCES} ${HEADERS})

add_dependencies(${LIB_NAME} Stato::Models)
add_dependencies(${LIB_NAME}_static Stato::Models)

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
  Stato::Models

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

)





install (TARGETS ${LIB_NAME}
  RUNTIME DESTINATION bin
  PUBLIC_HEADER DESTINATION include
  LIBRARY DESTINATION lib
  ARCHIVE DESTINATION lib
  )

install(
  DIRECTORY ${SRC_DIR}/stato/
  DESTINATION include/stato
  FILES_MATCHING PATTERN "*.h"
)



target_link_libraries(
  ${LIB_NAME}_static

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

)

# INSTALL
install (TARGETS ${LIB_NAME}_static
  RUNTIME DESTINATION bin
  PUBLIC_HEADER DESTINATION include
  LIBRARY DESTINATION lib
  ARCHIVE DESTINATION lib
  )
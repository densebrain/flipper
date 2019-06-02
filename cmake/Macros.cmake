
macro(GET_LIB_NAME OUT_NAME IN_NAME)
  set(${OUT_NAME} ${IN_NAME})
#  if (CMAKE_BUILD_TYPE STREQUAL Debug)
#    set(${OUT_NAME} "${IN_NAME}_debug")
##    string(TOLOWER ${${OUT_NAME}} ${OUT_NAME})
#  endif()
endmacro()

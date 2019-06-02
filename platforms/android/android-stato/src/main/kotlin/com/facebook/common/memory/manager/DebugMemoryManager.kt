package com.facebook.common.memory.manager

val ON_CLOSE_TO_DALVIK_HEAP_LIMIT = 1

val ON_SYSTEM_LOW_MEMORY_WHILE_APP_IN_FOREGROUND = 2

val ON_SYSTEM_LOW_MEMORY_WHILE_APP_IN_BACKGROUND = 3

val ON_APP_BACKGROUNDED = 4

interface DebugMemoryManager {

  fun trimMemory(trimType: Int)


}


#pragma once

#include <mutex>

typedef unsigned char __8;
typedef unsigned short __16;
typedef unsigned int __32;
typedef unsigned long long __64;

typedef __8 u8;
typedef __16 u16;
typedef __32 u32;
typedef __64 u64;

typedef char s8;
typedef short s16;
typedef int s32;
typedef long long int s64;

typedef unsigned short u16;
typedef unsigned char u8;

typedef unsigned int uint;
typedef unsigned long ulong;

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;

#define LOCK(mutexName,lockName) std::lock_guard<std::mutex> lockName(mutexName)
#define ULOCK(mutexName,lockName) std::unique_lock<std::mutex> lockName(mutexName)


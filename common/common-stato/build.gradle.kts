
plugins {
  id("idea")
  id("org.cxxpods.gradle.cmake-plugin")
}

addStatoRepositories()


cmake {

  val androidToolchainFile = File(rootDir,"cmake/toolchains/android.cmake")
  val iosToolchainFile = File(rootDir,"cmake/toolchains/ios.cmake")

  sourceFolder = projectDir
  buildTypes.clear()
  buildTypes("Debug")
  buildTypes("Release")

  toolchains.clear()

  targets.clear()
  val target = "statocpp"
  targets.add(target)



  listOf(
    listOf("arm_android","armeabi-v7a"),
    listOf("aarch64_android","arm64-v8a")
  ).forEach { (name, abi) ->
    toolchains(name, androidToolchainFile) {
      useAndroidNDK(version = "3.10")
      configOptions {
        option("ANDROID_ABI", abi)
        //option("ANDROID_TOOLCHAIN", "gcc")
        option("ANDROID_TOOLCHAIN", "clang")
        option("ANDROID_STL", "c++_static")
        option("CXXPODS_SYSTEM", name)
      }
    }
  }

  listOf(
    listOf("arm_ios","armv7", "OS"),
    listOf("aarch64_ios","arm64", "OS64")
  ).forEach { (name, abi, platform) ->
    toolchains(name, iosToolchainFile) {
      configOptions{
        option("PLATFORM", platform)
        option("CMAKE_OSX_ARCHITECTURES", abi)
        option("DEPLOYMENT_TARGET","9.00")
        option("CXXPODS_SYSTEM", name)
        option("ENABLE_BITCODE", "ON")
        option("ENABLE_VISIBILITY", "ON")
        option("ENABLE_ARC", "ON")
        option("ARCHS", abi)
      }
    }
  }

  toolchains.forEach { chain ->
    with(chain) {
      installPrefix = commonStatoInstallPrefix(chain.name)
    }
  }

  logger.quiet("Toolchains: ${toolchains.joinToString { it.name}}")
}





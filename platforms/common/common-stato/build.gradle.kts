import org.cxxpods.gradle.util.io
import java.nio.file.Files

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
    listOf("aarch64_android","arm64-v8a"),
    listOf("x86_android","x86")
  ).forEach { (name, abi) ->
    toolchains(name, androidToolchainFile) {
      useAndroidNDK(version = "3.10")
      configOptions {
        option("__ANDROID__","true")
        option("ANDROID","true")
        option("ANDROID_ABI", abi)
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



afterEvaluate {

  val updateJNILibs by tasks.registering {
    doLast {
      val jniLibDir = file("${rootDir}/../../build/jni-libs").apply {
        mkdirs()
      }

      val nativeDir = file("${rootDir}/../../build/native")
      nativeDir.walk()

        .forEach { f ->
          if (arrayOf("libcommon-stato", "android").all { f.absolutePath.toLowerCase().contains(it)}) {
            val arch = when {
              f.absolutePath.contains("aarch64") -> "arm64-v8a"
              else -> "armeabi-v7a"
            }


            val jniLibFile = File("${jniLibDir}/lib/${arch}/${f.name}")
            logger.quiet("Copying ${f} to ${jniLibFile}")
            io.mkdirs(jniLibFile.parentFile.parentFile)
            io.mkdirs(jniLibFile.parentFile)

            if (jniLibFile.exists()) jniLibFile.delete()
            Files.copy(f.toPath(), jniLibFile.toPath())
          }
        }
    }
  }

  tasks
  .filter { it.name.startsWith("cmakeInstall") }
  .forEach {
    logger.quiet("Updating ${it.name}")
    it.finalizedBy(updateJNILibs)
  }


}

import com.android.build.gradle.LibraryExtension
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  id("idea")
  id("com.android.library")
  kotlin("android") // version(Versions.plugins.kotlin)
  kotlin("android.extensions") // version(Versions.plugins.kotlin)
  id("kotlin-sam-with-receiver")
  id("kotlin-noarg")
  id("kotlin-kapt")
  id("signing")
  id("com.jfrog.bintray")
  id("maven-publish")
}

setupAndroidProject(project)




configure<LibraryExtension> {

  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")

    multiDexEnabled = true

    externalNativeBuild {
      cmake {
        arguments.addAll(listOf("-DANDROID_TOOLCHAIN=clang", "-DANDROID_STL=c++_static"))

        targets.clear()
        targets.add(project.name)
        abiFilters.clear()
        abiFilters.addAll(setOf("arm64-v8a", "armeabi-v7a"))
      }
    }
  }

//  splits {
//    abi {
//      isEnable = true
//      isUniversalApk = false
//      reset()
//      include("arm64-v8a", "armeabi-v7a")
//    }
//  }

  buildTypes {

    //    getByName("release") {
//      isMinifyEnabled = false
//      isDebuggable = false
//      isJniDebuggable = false
//    }
//
//    getByName("debug") {
//      isMinifyEnabled = false
//      isDebuggable = true
//      isJniDebuggable = true
//    }

//    create("local") {
//      isMinifyEnabled = false
//      isDebuggable = true
//      isJniDebuggable = true
//
//      externalNativeBuild {
//        cmake {
//          abiFilters.clear()
//          abiFilters.addAll(setOf("arm64-v8a"))
//        }
//      }
  }


  lintOptions {
    isAbortOnError = false
  }


  sourceSets["test"].apply {
    java.exclude("org/stato/plugins/facebook/**")
  }


  externalNativeBuild {
    cmake {
      version = "3.10.2"
      path = file("CMakeLists.txt")
    }
  }

  dexOptions {
    javaMaxHeapSize = "4g"
  }


}

setupAndroidPublishProject(project, true)



project.afterEvaluate {
  tasks {


    val commonLib = project(":common:common-stato")

    getByName("preDebugBuild").dependsOn(commonLib.tasks.filter { task ->
      arrayOf("install", "debug", "android").all {
        task.name.toLowerCase().contains(it)
      }
    })
    getByName("preReleaseBuild").dependsOn(commonLib.tasks.filter { task ->
      arrayOf("install", "release", "android").all {
        task.name.toLowerCase().contains(it)
      }
    })
//    configure<LibraryExtension> {
//      libraryVariants.forEach { variant ->
//        logger.quiet("Variant Filters: ${variant}")
//        val commonConfigs = when (variant.buildType.name) {
//          "local" -> listOf("arm64_android")
//          else -> listOf("arm64_android", "arm_android")
//        }
//
//        preBuild.dependsOn(commonConfigs.map { commonConfig ->
//          commonLib.tasks.filter { task ->
//            arrayOf("install", commonConfig).all {
//              task.name.toLowerCase().contains(it)
//            }
//          }
//        })
//      }

    //project(":common:common-stato").tasks.getByName("")
    //dependsOn()
  }

}

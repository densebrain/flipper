plugins {
  `platform-android-lib`
}

android {
  sourceSets {
    getByName("main") {
      jniLibs.srcDirs("${rootDir}/../../build/jni-libs/lib")
    }
  }
}

dependencies {
  compileOnly(deps.lithoAnnotations)

  implementation(project(":android-fbjni"))
  implementation(kotlin("stdlib-jdk7",Versions.kotlin))
  implementation(kotlin("reflect",Versions.kotlin))
  implementation(deps.droidLogger)
  implementation(deps.supportMultidex)
  implementation(deps.soloader)
  implementation(deps.jsr305)
  implementation(deps.mdns)
  implementation(deps.supportAppCompat)
  implementation(deps.stetho)
  implementation(deps.okhttp3)
  implementation(deps.lithoCore)
  implementation(deps.lithoSectionsDebug)
  implementation(deps.lithoSectionsCore)
  implementation(deps.lithoWidget)
  implementation(deps.supportRecyclerView)
  implementation(deps.rhino)
  implementation(deps.fresco)
  implementation(deps.frescoStato)
  implementation(deps.frescoStetho)
  listOf(
    *deps.reactive
  ).forEach { implementation(it) }


  compileOnly(deps.leakcanary)

  testImplementation(deps.mockito)
  testImplementation(deps.robolectric)
  testImplementation(deps.hamcrest)
  testImplementation(deps.junit)
}
//
//project.afterEvaluate {
//  tasks {
//
//    val commonLib = gradle.includedBuild("common-stato")//project(":common-stato")
//
//    val abis = arrayOf("Arm_android", "Aarch64_android", "X86_android")
//
//
//    getByName("preDebugBuild").dependsOn(abis.map { abi -> commonLib.task(":cmakeInstallStatocppDebug${abi}") })
//    getByName("preReleaseBuild").dependsOn(abis.map { abi -> commonLib.task(":cmakeInstallStatocppRelease${abi}") })
//  }
//}
//
//val commonLib = project(":common:common-stato")
//
//  tasks {
//
//
//    val updateJniLibs by registering {
//      doLast {
//        logger.quiet("Updating JNI Libs")
//      }
//    }
//
//logger.quiet("Checking for common tasks")
//    commonLib.tasks
//      .filter {
//        logger.quiet("Filtering ${it.name}")
//        it.name.startsWith("cmakeInstall")
//      }
//      .forEach {
//        logger.quiet("Attaching to ${it.name}")
//        updateJniLibs.mustRunAfter(updateJniLibs)
//        it.finalizedBy(updateJniLibs)
//      }
//  }


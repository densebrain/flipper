import com.android.build.gradle.TestedExtension

plugins {
  id("com.android.library")
  id("signing")
  id("com.jfrog.bintray")
  id("maven-publish")
}

setupAndroidProject(project)

android {

  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")

    multiDexEnabled = true

    externalNativeBuild {
      cmake {
        arguments.addAll(listOf("-DANDROID_TOOLCHAIN=clang", "-DANDROID_STL=c++_static"))
        targets.clear()
        targets.add("stato")
      }
    }
  }

  lintOptions {
    isAbortOnError = false
  }


  sourceSets["test"].apply {
    java.exclude("com/facebook/stato/plugins/facebook/**")
  }


  externalNativeBuild {
    cmake {
      path = file("CMakeLists.txt")
    }
  }

  dexOptions {
    javaMaxHeapSize = "4g"
  }
}

dependencies {
  compileOnly(deps.lithoAnnotations)

  //compileOnly(project(":common:xplat"))
  implementation(project(":platforms:android:fbjni"))

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

tasks {
  val xplatBuild = getByPath(":common:xplat:assembleRelease")

  getByName("build") {
    dependsOn(xplatBuild)
  }
}

setupAndroidPublishProject(project, true)

//setupAndroidThirdPartyProject(project)

// apply from: rootProject.file("gradle/release.gradle")

// tasks.create("sourcesJar", Jar) {
//     from android.sourceSets.main.java.srcDirs
//     classifier = "sources"
// }

// artifacts.add("archives", sourcesJar)

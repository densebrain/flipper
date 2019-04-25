import com.android.build.gradle.TestedExtension

plugins {
  id("maven-publish")
  id("com.android.library")
  id("signing")
  id("com.jfrog.bintray")
}

setupAndroidProject(project)

android {

  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")

    externalNativeBuild {
      cmake {
        arguments.addAll(listOf("-DANDROID_TOOLCHAIN=clang", "-DANDROID_STL=c++_shared"))
        targets.clear()
        targets.add("flipper")
      }
    }
  }

    lintOptions {
        isAbortOnError = false
    }


  sourceSets["test"].apply {


    java.exclude("com/facebook/flipper/plugins/facebook/**")

  }


  externalNativeBuild {
    cmake {
      path = file("CMakeLists.txt")
    }
  }

//    repositories {
//        maven { url "https://jitpack.io" }
//    }
}

dependencies {
  compileOnly(deps.lithoAnnotations)
  implementation(project(":platforms:android:fbjni"))
  implementation(project(":common:xplat"))
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
  implementation(deps.frescoFlipper)
  implementation(deps.frescoStetho)
  listOf(
    "io.reactivex.rxjava2:rxandroid:2.1.1",
    "io.reactivex.rxjava2:rxjava:2.2.8",
    "org.reactivestreams:reactive-streams:1.0.2"
  ).forEach { implementation(it) }


  compileOnly(deps.leakcanary)

  testImplementation(deps.mockito)
  testImplementation(deps.robolectric)
  testImplementation(deps.hamcrest)
  testImplementation(deps.junit)
  testImplementation(deps.junit)
}

val sourcesJar by tasks.registering(Jar::class) {
  from(android.sourceSets["main"].java.srcDirs)
  archiveClassifier.set("sources")
}
artifacts.add("archives", sourcesJar)

tasks.withType(Javadoc::class).all {
  enabled = false
}


//preBuild.dependsOn(tasks.getByPath(":third-party:prepare"))

// apply from: rootProject.file("gradle/release.gradle")

// tasks.create("sourcesJar", Jar) {
//     from android.sourceSets.main.java.srcDirs
//     classifier = "sources"
// }

// artifacts.add("archives", sourcesJar)

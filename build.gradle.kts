import com.android.build.gradle.LibraryExtension
import com.jfrog.bintray.gradle.tasks.BintrayUploadTask


buildscript {
  repositories {
    mavenLocal()
    google()
    gradlePluginPortal()
    jcenter()
    mavenCentral()
    maven(url = "https://jitpack.io")
    maven(url = "https://dl.bintray.com/kotlin/kotlin-eap")
  }

  dependencies {
    classpath("com.android.tools.build:gradle:${Plugins.Android}")
  }
}

plugins {
  id("idea")
}


val publishedProjects = mutableListOf<String>()

tasks.create("publishReleaseArtifacts")

subprojects {
  group = getProjectProperty("GROUP") ?: group
  //applyfrom: rootProject.file("gradle/buildscript.gradle")

  // repositories {
  //   google()
  //   mavenLocal()
  //   mavenCentral()
  //   jcenter()

  //   maven { url "https://jitpack.io" }

  //   if (isSnapshot()) {
  //     maven { url "https://oss.sonatype.org/content/repositories/snapshots/" }
  //   }
  // }

//   afterEvaluate {
//     val abiFilters = new HashSet<String>(Arrays.asList((rootProject.properties["abi.variants"] as String).split(",")))
//     if (extensions.findByType(LibraryExtension) != null) {
//       extensions.configure(LibraryExtension) { LibraryExtension libExt ->
//         if (libExt.externalNativeBuild.cmake.path != null)
//           libExt.defaultConfig.externalNativeBuild
//             .cmake
//             .setAbiFilters(abiFilters)
//       }
//     }

//     tasks.withType(BintrayUploadTask) { task ->
//       logger.quiet("Adding published project: ${project.name}")
//       publishedProjects.add(project.name)
//       bintrayUploadAll.dependsOn(task)
//     }

//   }
}






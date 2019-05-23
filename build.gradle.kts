import com.android.build.gradle.LibraryExtension
import com.jfrog.bintray.gradle.tasks.BintrayUploadTask

buildscript {
  repositories {
    mavenLocal()
    google()
    gradlePluginPortal()
    jcenter()
    mavenCentral()
    maven { url = java.net.URI("https://jitpack.io") }
    maven {
      url = java.net.URI("https://dl.bintray.com/kotlin/kotlin-eap")
    }
  }
  dependencies {
    classpath("com.android.tools.build:gradle:${Plugins.Android}")
  }
}

//plugins {
//  id "de.undercouch.download" version "3.4.3"
//  ///id "com.github.ben-manes.versions" version "0.20.0"
//  //id "com.github.dcendents.android-maven" version "2.1"
//}
//apply plugin: "com.jfrog.bintray"

// ext.isSnapshot = { VERSION_NAME.contains("SNAPSHOT") }
// ext.isRelease = {
//   ["uploadArchives", "bintrayUpload"].any { gradle.startParameter.taskNames.contains(it) }
// }

// def bintrayUploadAll = tasks.create("bintrayUploadAll") {

// }

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






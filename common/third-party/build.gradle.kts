plugins {
  id("com.android.library")
//  kotlin("android") // version(Versions.plugins.kotlin)
//  kotlin("android.extensions") // version(Versions.plugins.kotlin)
  id("de.undercouch.download") version ("3.4.3")
  id("com.github.ben-manes.versions") version ("0.20.0")
  id("com.github.dcendents.android-maven") version ("2.1")
}


setupAndroidProject(project)

android {
  sourceSets["main"].apply {
    manifest.srcFile("./AndroidManifest.xml")
  }
}

apply(from = "native.gradle")

tasks {
  val prepareAllLibs = getByName("prepareAllLibs")

  // After preparation, assemble
  prepareAllLibs.finalizedBy(
    arrayOf("folly","double-conversion", "glog", "LibEvent", "RSocket")
      .map { ":common:third-party:external:${it}:assemble" }
  )

  val prepare = create("prepare") {
    dependsOn(prepareAllLibs)
  }

  getByName("build") {
    dependsOn(prepare)
  }

  getByName("clean") {
    dependsOn(getByName("cleanNative"))
  }

  getByName("preBuild") {
    dependsOn(prepare)
  }
}






//dependencies {
//  "implementation"(project(":common:third-party:external:folly"))
//  "implementation"(project(":common:third-party:external:double-conversion"))
//  "implementation"(project(":common:third-party:external:glog"))
//  "implementation"(project(":common:third-party:external:LibEvent"))
//  "implementation"(project(":common:third-party:external:RSocket"))
//}


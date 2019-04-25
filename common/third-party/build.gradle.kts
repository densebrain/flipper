plugins {
  id("com.android.library")
//  kotlin("android") // version(Versions.plugins.kotlin)
//  kotlin("android.extensions") // version(Versions.plugins.kotlin)
  id("de.undercouch.download") version ("3.4.3")
  id("com.github.ben-manes.versions") version ("0.20.0")
  id("com.github.dcendents.android-maven") version ("2.1")
}

apply(from = "native.gradle")

setupAndroidProject(project)

android {
  sourceSets["main"].apply {
    manifest.srcFile("./AndroidManifest.xml")
  }
}



tasks {
  create("prepare") {
    dependsOn(getByName("prepareAllLibs"))
  }

  getByName("build") {
    dependsOn(getByName("prepare"))
  }

  getByName("clean") {
    dependsOn(getByName("cleanNative"))
  }
}

dependencies {
  "implementation"(project(":common:third-party:external:folly"))
  "implementation"(project(":common:third-party:external:doubleconversion"))
  "implementation"(project(":common:third-party:external:glog"))
  "implementation"(project(":common:third-party:external:LibEvent"))
  "implementation"(project(":common:third-party:external:RSocket"))
}


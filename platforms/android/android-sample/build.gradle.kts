plugins {
  id("maven-publish")
  id("com.android.application")
  kotlin("android") // version(Versions.plugins.kotlin)
  kotlin("android.extensions") // version(Versions.plugins.kotlin)
  id("kotlin-sam-with-receiver")
  id("kotlin-noarg")
  id("kotlin-kapt")
}

setupAndroidProject(project)

android {

  lintOptions {
    isAbortOnError = false
  }


  sourceSets {
    getByName("main").apply {
      manifest.srcFile("./AndroidManifest.xml")
    }
  }

}



dependencies {
  implementation(kotlin("stdlib-jdk7",Versions.kotlin))
  implementation(kotlin("reflect",Versions.kotlin))
  implementation(deps.leakcanary)

  // Android Support Library
  implementation(deps.supportAppCompat)

  // Litho
  implementation(deps.lithoCore)
  implementation(deps.lithoWidget)
  compileOnly(deps.lithoAnnotations)

  // TODO(T40752310): Temporary while we depend on the jitpack artifact with a different group.
  implementation(deps.lithoFresco) {
    isTransitive = true
  }

  kapt(deps.lithoAnnotationSectionsProcessor)
  kapt(deps.lithoAnnotationsProcessor)

  // Third-party
  implementation(deps.soloader)
  implementation(deps.okhttp3)
  implementation(deps.fresco)
  implementation(deps.frescoStato)


  // Integration test
  androidTestImplementation(deps.testCore)
  androidTestImplementation(deps.testRules)

  implementation(project(":platforms:android:android-stato")) {
    isTransitive = true
  }
  implementation(project(":platforms:android:android-fbjni"))
}

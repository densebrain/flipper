plugins {
  id("maven-publish")
  id("com.android.application")
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
  implementation(deps.leakcanary)

  // Android Support Library
  implementation(deps.supportAppCompat)

  // Litho
  implementation(deps.lithoCore)
  implementation(deps.lithoWidget)
  implementation(deps.lithoAnnotations)
  // TODO(T40752310): Temporary while we depend on the jitpack artifact with a different group.
  implementation(deps.lithoFresco)
  annotationProcessor(deps.lithoAnnotationSectionsProcessor)
  annotationProcessor(deps.lithoAnnotationsProcessor)

  // Third-party
  implementation(deps.soloader)
  implementation(deps.okhttp3)
  implementation(deps.fresco)

  // Integration test
  androidTestImplementation(deps.testCore)
  androidTestImplementation(deps.testRules)

  implementation(project(":platforms:android:android-states"))
  implementation(project(":platforms:android:fbjni"))
  implementation(project(":common:xplat"))
}
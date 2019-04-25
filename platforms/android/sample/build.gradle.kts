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
    // Android Support Library
    implementation(deps.supportAppCompat)

    // Litho
    implementation(deps.lithoCore)
    implementation(deps.lithoWidget)
    implementation(deps.lithoAnnotations)
    // TODO(T40752310): Temporary while we depend on the jitpack artifact with a different group.
    implementation(deps.lithoFresco)
    annotationProcessor(deps.lithoProcessor)

    // Third-party
    implementation(deps.soloader)
    implementation(deps.okhttp3)
    implementation(deps.fresco)

    // Integration test
    androidTestImplementation(deps.testCore)
    androidTestImplementation(deps.testRules)

    implementation(project(":platforms:android:android-flipper"))
}

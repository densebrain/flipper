plugins {
  `platform-android-lib`
}



dependencies {
  compileOnly(deps.lithoAnnotations)

  implementation(project(":platforms:android:android-fbjni"))
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



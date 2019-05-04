plugins {
  `common-external`
}


android {
  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")
    externalNativeBuild {
      cmake {
        targets.clear()
        targets.addAll(listOf("rsocket"))
      }
    }
  }

  sourceSets["main"].apply {
    manifest.srcFile("./ApplicationManifest.xml")
  }
}

dependencies {
  implementation(project(":common:third-party:external:glog"))
  implementation(project(":common:third-party:external:double-conversion"))
  implementation(project(":common:third-party:external:LibEvent"))
  implementation(project(":common:third-party:external:folly"))
}


//'x86', 'x86_64', 'armeabi-v7a',

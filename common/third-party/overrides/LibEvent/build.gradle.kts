plugins {
  `common-external`
}


android {
  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")

    externalNativeBuild {
      cmake {
        targets.clear()
        targets.addAll(listOf("event","event_extra","event_core"))
      }
    }
  }

  sourceSets["main"].apply {
    manifest.srcFile("./ApplicationManifest.xml")
  }
}

dependencies {
  implementation(project(":common:third-party:external:glog"))
}
plugins {
  `common-external`
}



android {
  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")
  }

  sourceSets["main"].apply {
    jni.srcDir("${projectDir}/glog-0.3.5/src")
    manifest.srcFile("./ApplicationManifest.xml")
  }
}


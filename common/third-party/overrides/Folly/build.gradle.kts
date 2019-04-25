plugins {
  `common-external`
}

android {
  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")
  }

  sourceSets["main"].apply {
    jni.srcDir("${projectDir}/folly")
    manifest.srcFile("./ApplicationManifest.xml")
  }
}

dependencies {
  implementation(project(":common:third-party:external:glog"))
  implementation(project(":common:third-party:external:doubleconversion"))
}
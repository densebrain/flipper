plugins {
  `common-external`
}

android {
  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")
    externalNativeBuild.cmake {
      targets.clear()
      targets.add("doubleconversion")
    }
  }

  sourceSets["main"].apply {
    jni.srcDir("${projectDir}/double-conversion-3.0.0")
    manifest.srcFile("./ApplicationManifest.xml")
  }
}

dependencies {

}
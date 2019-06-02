
plugins {
  `platform-android-lib`
}

android {
//  sourceSets {
//    getByName("test").apply {
//      kotlin.exclude("org/stato/plugins/facebook/**")
//    }
//  }
}


dependencies {
  implementation(deps.supportMultidex)
  compileOnly(deps.jsr305)
  compileOnly(deps.inferAnnotations)
  compileOnly(deps.lithoAnnotations)
  implementation(deps.soloader)
  testImplementation(deps.junit)
}



plugins {
  `platform-android-lib`
}

dependencies {
  implementation(deps.supportMultidex)
  compileOnly(deps.jsr305)
  compileOnly(deps.inferAnnotations)
  compileOnly(deps.lithoAnnotations)
  implementation(deps.soloader)
  testImplementation(deps.junit)
}


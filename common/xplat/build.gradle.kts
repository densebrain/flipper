plugins {
  `common-external`
}

android {
  defaultConfig {
    externalNativeBuild {
      cmake {
        arguments.add("-DANDROID_TOOLCHAIN=clang")
        targets.clear()
        targets.add("flippercpp")
      }
    }
  }

  sourceSets["main"].apply {
    manifest.srcFile("./AndroidManifest.xml")
  }

}

dependencies {
  implementation(project(":common:third-party"))
//  implementation(project(":folly"))
//  implementation(project(":libevent"))
//  implementation(project(":rsocket"))
//  implementation(project(":glog"))
//  implementation(project(":doubleconversion"))
}

//preBuild.dependsOn(tasks.getByPath(":third-party:prepare"))

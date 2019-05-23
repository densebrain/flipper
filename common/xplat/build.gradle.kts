plugins {
  `common-external`
}

android {
  defaultConfig {
    externalNativeBuild {
      cmake {
        arguments.addAll(arrayOf("-DANDROID_TOOLCHAIN=clang","-DCMAKE_CXX_FLAGS=-Wno-error","-DANDROID_DISABLE_FORMAT_STRING_CHECKS=ON"))
        targets.clear()
        targets.add("flippercpp")
        cppFlags.addAll(arrayOf("-Wno-error"))
      }
    }
  }

  sourceSets["main"].apply {
    manifest.srcFile("./AndroidManifest.xml")
  }

}

val prepareLibs = tasks.getByPath(":common:third-party:prepare")
tasks.forEach { t ->
  if (t.name.startsWith("externalNative"))
    t.dependsOn(prepareLibs)
}

tasks.getByName("preBuild").dependsOn(tasks.getByPath(":common:third-party:prepare"))

setupAndroidThirdPartyProject(project)
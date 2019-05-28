
plugins {
  id("com.android.library")
  id("maven-publish")
  id("signing")
  id("com.jfrog.bintray")
}

setupAndroidProject(project)

android {

  defaultConfig {
    buildConfigField("boolean", "IS_INTERNAL_BUILD", "true")

    multiDexEnabled = true

    externalNativeBuild {
      cmake {
        arguments.addAll(listOf("-DANDROID_TOOLCHAIN=clang", "-DANDROID_STL=c++_static"))
        targets.clear()
        targets.add("statofb")
      }
    }
  }

  sourceSets {
    getByName("main").apply {
      manifest.srcFile("./AndroidManifest.xml")
    }

    getByName("test").apply {
      java.exclude("com/facebook/stato/plugins/facebook/**")
    }
  }



  externalNativeBuild {
    cmake {
      path = file("CMakeLists.txt")
    }
  }


}


dependencies {
  implementation(project(":common:xplat"))
  implementation(deps.supportMultidex)
  compileOnly(deps.jsr305)
  compileOnly(deps.inferAnnotations)
  compileOnly(deps.lithoAnnotations)
  implementation(deps.soloader)
  testImplementation(deps.junit)
}

setupAndroidPublishProject(project,true)
//setupAndroidThirdPartyProject(project)


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

    externalNativeBuild {
      cmake {
        arguments.addAll(listOf("-DANDROID_TOOLCHAIN=clang", "-DANDROID_STL=c++_static"))
        targets.clear()
        targets.add("statesfb")
      }
    }
  }

  sourceSets {
    getByName("main").apply {
      manifest.srcFile("./AndroidManifest.xml")
    }

    getByName("test").apply {
      java.exclude("com/facebook/states/plugins/facebook/**")
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

  compileOnly(deps.jsr305)
  compileOnly(deps.inferAnnotations)
  compileOnly(deps.lithoAnnotations)
  implementation(deps.soloader)
  testImplementation(deps.junit)
}

setupAndroidPublishProject(project,true)
setupAndroidThirdPartyProject(project)

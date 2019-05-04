plugins {
  id("com.android.library")
}

setupAndroidProject(project)

configure<com.android.build.gradle.LibraryExtension> {
  defaultConfig {
    externalNativeBuild {
      cmake {
        arguments.addAll(listOf("-DANDROID_TOOLCHAIN=clang", "-DANDROID_STL=c++_static"))
        targets.addAll(listOf(project.name))
      }
    }
  }

//  lintOptions {
//    abortOnError = false
//  }

  externalNativeBuild {
    cmake {
      path = file("CMakeLists.txt")
    }
  }
}



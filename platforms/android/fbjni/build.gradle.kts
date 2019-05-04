import com.android.build.gradle.TestedExtension
import org.gradle.api.tasks.bundling.Jar

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
        targets.add("flipperfb")
      }
    }
  }

//    lintOptions {
//        abortOnError = false
//    }


  sourceSets {
    getByName("main").apply {
      manifest.srcFile("./AndroidManifest.xml")
    }

    getByName("test").apply {
      java.exclude("com/facebook/flipper/plugins/facebook/**")
    }
  }



  externalNativeBuild {
    cmake {
      path = file("CMakeLists.txt")
    }
  }

//    repositories {
//        maven { url "https://jitpack.io" }
//    }
}


dependencies {
  compileOnly(deps.jsr305)
  compileOnly(deps.inferAnnotations)
  compileOnly(deps.lithoAnnotations)
  implementation(deps.soloader)

  testImplementation(deps.junit)
}

setupAndroidPublishProject(project)

//buildscript {
//    repositories {
//        google()
//        jcenter()
//        gradlePluginPortal()
//        mavenCentral()
//    }
//    dependencies {
//        classpath 'com.android.tools.build:gradle:3.5.0-alpha10'
//        classpath "com.jfrog.bintray.gradle:gradle-bintray-plugin:1.8.4"
//    }
//}

//
//plugins {
//    id("com.android.library")
//    id("maven-publish")
//    id('com.jfrog.bintray')
//    id("signing")
//    //id('com.github.dcendents.android-maven')
//}
//
//android {
//    compileSdkVersion rootProject.compileSdkVersion
//    buildToolsVersion rootProject.buildToolsVersion
//
//    defaultConfig {
//        minSdkVersion rootProject.minSdkVersion
//        targetSdkVersion rootProject.targetSdkVersion
//        sourceSets {
//            main {
//                manifest.srcFile './ApplicationManifest.xml'
//                java {
//                    srcDir 'java'
//                }
//            }
//        }
//
//        externalNativeBuild {
//            cmake {
//                arguments '-DANDROID_TOOLCHAIN=clang'
//                targets 'flipperfb'
//            }
//        }
//    }
//
//    externalNativeBuild {
//        cmake {
//            path 'CMakeLists.txt'
//        }
//    }
//}
//
//dependencies {
//    // compileOnly dependencies
//    compileOnly deps.jsr305
//    compileOnly deps.inferAnnotations
//    compileOnly deps.lithoAnnotations
//    implementation deps.soloader
//}
//
//apply from: rootProject.file('gradle/release.gradle')
//
//val sourcesJar by tasks.registering(Jar::class) {
//  from(android.sourceSets["main"].java.srcDirs)
//  archiveClassifier.set("sources")
//}
//artifacts.add("archives", sourcesJar)
//
//tasks.withType(Javadoc::class).all {
//  enabled = false
//}

import Script.Plugins

buildscript {

  apply(from = "${rootDir}/ko-gradle.gradle")

  repositories {
    google()
    jcenter()
    gradlePluginPortal()
    mavenCentral()
    maven(url = "https://dl.bintray.com/densebrain/oss")
    maven(url = "https://jitpack.io")
    flatDir {
      dirs("${buildDir}/ko-repo/ko-artifact")
    }
  }

  dependencies {
    classpath("ko-artifact:ko:1.0.0")
  }
}

plugins {
  base
  java
  `kotlin-dsl`
  id("org.densebrain.gradle.ko-generator-plugin")
}

repositories {
  google()
  jcenter()
  gradlePluginPortal()
  mavenCentral()
  maven(url = "https://dl.bintray.com/densebrain/oss")
  maven(url = "https://jitpack.io")
}

dependencies {
  "api"(gradleApi())
  "implementation"("org.jetbrains.kotlin:kotlin-noarg:${Plugins.Kotlin}")
  "implementation"("org.jetbrains.kotlin:kotlin-sam-with-receiver:${Plugins.Kotlin}")
  "implementation"("com.android.tools.build:gradle:${Plugins.Android}")
  "implementation"("org.jetbrains.kotlin:kotlin-gradle-plugin:${Plugins.Kotlin}")
  "implementation"("com.jfrog.bintray.gradle:gradle-bintray-plugin:${Plugins.Bintray}")
}
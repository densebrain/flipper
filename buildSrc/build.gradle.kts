import Script.Plugins
buildscript {
  apply(from = "ko-gradle.gradle")

  repositories {
    google()
    jcenter()
    gradlePluginPortal()
    mavenCentral()
    maven(url = "https://dl.bintray.com/densebrain/oss")
    maven(url = "https://jitpack.io")
  }
  repositories {
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
  "api"("com.android.tools.build:gradle:${Plugins.Android}")
  "implementation"("com.jfrog.bintray.gradle:gradle-bintray-plugin:${Plugins.Bintray}")
}
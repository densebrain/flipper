//include(":common:third-party")
//if (File(rootDir,"common${File.separator}third-party${File.separator}external${File.separator}double-conversion").exists()) {
//  include(":common:third-party:external:folly")
//  include(":common:third-party:external:double-conversion")
//  include(":common:third-party:external:glog")
//  include(":common:third-party:external:LibEvent")
//  include(":common:third-party:external:RSocket")
//}
include(":common:xplat")

//include(":platforms")
include(":platforms:android:fbjni")
include(":platforms:android:stato")
include(":platforms:android:sample")

project(":platforms:android:stato").apply {
  name = "android-stato"
}

project(":platforms:android:sample").apply {
  name = "android-sample"
}

pluginManagement {
  addStatoRepositories()

  resolutionStrategy {
    eachPlugin {

      val module = when (requested.id.namespace) {
        "com.android" -> "com.android.tools.build:gradle:${Versions.Plugins.Android}"
        "com.jfrog" -> "com.jfrog.bintray.gradle:gradle-bintray-plugin:${Versions.Plugins.Bintray}"
        "org.jetbrains.kotlin.frontend" -> "org.jetbrains.kotlin:kotlin-frontend-plugin:${Versions.Plugins.KotlinFrontend}"
        "org.jetbrains.kotlin" -> "org.jetbrains.kotlin:kotlin-gradle-plugin:${Versions.Plugins.Kotlin}"
        else -> null
      }

      logger.debug("Plugin requested (${requested.id.namespace}/${requested.id.name}): ${module}")
      if (module != null) {
        useModule(module)
      }

    }
  }
}
// include ':platforms:android'
// include ':folly'
// include ':fbjni'
// include ':easywsclient'
// include ':sonarcpp'
// include ':sample'
// include ':doubleconversion'
// include ':glog'
// include ':libevent'
// include ':rsocket'
// include ':third-party'

// project(":fbjni").projectDir = file("${rootDir}/libs/fbjni")
// project(":easywsclient").projectDir = file("${rootDir}/libs/easywsclient")
// project(":sonarcpp").projectDir = file("${rootDir}/xplat")
// project(":sample").projectDir = file("${rootDir}/android/sample")
// project(":android").projectDir = file("${rootDir}/android")
// project(":doubleconversion").projectDir = file("android/third-party/external/double-conversion/")
// project(":glog").projectDir = file("android/third-party/external/glog/")
// project(":folly").projectDir = file("android/third-party/external/folly/")
// project(":libevent").projectDir = file("android/third-party/external/LibEvent/")
// project(":rsocket").projectDir = file("android/third-party/external/RSocket/")
// project(":third-party").projectDir = file("${rootDir}/android/third-party/")

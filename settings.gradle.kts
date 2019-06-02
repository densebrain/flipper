enableFeaturePreview("GRADLE_METADATA")


include(":common:common-stato")

include(":platforms:android:android-fbjni")
include(":platforms:android:android-stato")
include(":platforms:android:android-sample")


pluginManagement {
  addStatoRepositories()

  resolutionStrategy {
    eachPlugin {

      val androidPlugin = "com.android.tools.build:gradle:${Plugins.Android}"
      val kotlinPlugin = "org.jetbrains.kotlin:kotlin-gradle-plugin:${Plugins.Kotlin}"

      val pluginMappings = mapOf(
        "org.jetbrains.kotlin.frontend" to "org.jetbrains.kotlin:kotlin-frontend-plugin:${Plugins.KotlinFrontend}",
        "kotlin-android" to androidPlugin,
        "com.android" to androidPlugin,
        "org.densebrain.gradle" to "org.densebrain.gradle:ko-generator-plugin:${Plugins.Ko}",
        "org.jetbrains" to kotlinPlugin,
        "org.cxxpods.gradle" to "org.cxxpods.gradle:cmake-plugin:${Plugins.Cxxpods}"
      )

      with(requested) {
        pluginMappings.entries
          .find { (test) ->
            listOfNotNull(id.namespace, id.name).any { it.startsWith(test) }
          }?.let { (_, mod) ->
            useModule(mod)
          }
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

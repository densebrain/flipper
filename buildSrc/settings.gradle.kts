import org.gradle.kotlin.dsl.maven
import java.util.*

val props = Properties().apply {
  load(file("${rootDir}/../gradle.properties").reader())
}

pluginManagement {
  repositories {
    mavenLocal()
    jcenter()
    mavenCentral()
    gradlePluginPortal()

    maven(url = "https://dl.bintray.com/densebrain/oss")
  }

  val androidPlugin = Pair("android", "com.android.tools.build:gradle")
  val kotlinPlugin = Pair("kotlin","org.jetbrains.kotlin:kotlin-gradle-plugin")
  val pluginMappings = mapOf(
    "kotlin-noarg" to Pair("kotlin", "org.jetbrains.kotlin:kotlin-noarg"),
    "kotlin-sam-with-receiver" to Pair("kotlin", "org.jetbrains.kotlin:kotlin-sam-with-receiver"),
    "kotlin-android" to androidPlugin,
    "com.android" to androidPlugin,
    "org.densebrain.gradle" to Pair("ko","org.densebrain.gradle:ko-generator-plugin"),
    "org.jetbrains" to kotlinPlugin,
    "org.cxxpods.gradle" to Pair("cxxpods","org.cxxpods.gradle:cmake-plugin")
  )

  resolutionStrategy {
    eachPlugin {
      with(requested) {
        pluginMappings.entries
          .find { (test) ->
            listOfNotNull(id.namespace, id.name).any { it.startsWith(test) }
          }?.let { (_, value) ->
            val (name, mod) = value
            useModule("${mod}:${props["plugins.${name}"]}")
          }
      }
    }
  }
}
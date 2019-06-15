pluginManagement {
  addStatoRepositories()

  resolutionStrategy {
    eachPlugin {
      if (requested.id.id == "org.springframework.boot") {
        useModule("org.springframework.boot:spring-boot-gradle-plugin:${requested.version}")

      } else if (requested.id.name.contains("spring")) {

      } else {
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

            listOfNotNull(id.namespace, id.name).any {
              it.startsWith(test)
            }
          }?.let { (_, mod) ->
            useModule(mod)
          }
      }
      }
    }
  }
}
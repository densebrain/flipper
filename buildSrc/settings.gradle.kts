import org.gradle.kotlin.dsl.maven

pluginManagement {
    repositories {
        mavenLocal()
        jcenter()
        mavenCentral()
        gradlePluginPortal()

        maven(url = "https://dl.bintray.com/densebrain/oss")
    }

    resolutionStrategy {
        eachPlugin {
            when {
                requested.id.name == "ko-generator-plugin" ->
                    // In a normal use case, you'll likely replace ${version} with either
                    // a dynamic version "+" or a static version "1.0.0"
                    useModule("org.densebrain.gradle:ko-generator-plugin:1.0.9")
                requested.id.namespace?.startsWith("org.jetbrains") == true ->
                    useModule("org.jetbrains.kotlin:kotlin-gradle-plugin:1.3.21")
            }
        }
    }
}
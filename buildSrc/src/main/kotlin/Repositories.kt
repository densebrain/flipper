@file:Suppress("UnstableApiUsage")

import org.gradle.api.Project
import org.gradle.api.artifacts.dsl.RepositoryHandler
import org.gradle.api.initialization.dsl.ScriptHandler
import org.gradle.kotlin.dsl.maven
import org.gradle.plugin.management.PluginManagementSpec

fun addRepositories(scriptHandler: ScriptHandler) = addRepositories(scriptHandler.repositories)

fun ScriptHandler.addStatoRepositories() = addRepositories(this.repositories)

fun addRepositories(pluginManagementSpec: PluginManagementSpec) = addRepositories(pluginManagementSpec.repositories)

fun PluginManagementSpec.addStatoRepositories() = addRepositories(this.repositories)

fun addRepositories(project: Project) = addRepositories(project.repositories)

fun Project.addStatoRepositories() = addRepositories(this.repositories)

/**
 * Add default repositories
 */
fun addRepositories(handler: RepositoryHandler) = with(handler) {
    google()
    jcenter()
    gradlePluginPortal()
    mavenCentral()
    maven(url = "https://dl.bintray.com/densebrain/oss")
    maven(url = "https://jitpack.io")

}
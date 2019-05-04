import com.android.build.gradle.LibraryExtension
import com.android.build.api.dsl.model.BuildType
import com.android.build.gradle.TestedExtension
import com.android.build.gradle.tasks.BundleAar
import org.gradle.api.Project
import org.gradle.api.artifacts.Dependency
import org.gradle.api.artifacts.ProjectDependency
import org.gradle.api.publish.PublishingExtension
import org.gradle.api.publish.maven.MavenPublication
import org.gradle.api.publish.maven.tasks.AbstractPublishToMaven
import org.gradle.api.publish.plugins.PublishingPlugin
import org.gradle.api.tasks.bundling.Jar
import org.gradle.api.tasks.javadoc.Javadoc
import org.gradle.kotlin.dsl.*

val Project.androidLibraryReleaseAar
  get() = tasks.getByName<BundleAar>("bundleReleaseAar").archiveFile

fun setupAndroidProject(project: Project) = with(project) {
  addRepositories(repositories)




  configure<TestedExtension> {
    setCompileSdkVersion(AndroidEnv.compileSdkVersion)
    setBuildToolsVersion(AndroidEnv.buildToolsVersion)

    useLibrary("android.test.runner")
    useLibrary("android.test.base")
    useLibrary("android.test.mock")

    defaultConfig {
      setMinSdkVersion(AndroidEnv.minSdkVersion)
      setTargetSdkVersion(AndroidEnv.targetSdkVersion)
      testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

    }

    buildTypes {
      getByName("release") {
        isMinifyEnabled = false
        setProguardFiles(listOf(getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"))
      }
    }

    testOptions {
      execution = "ANDROIDX_TEST_ORCHESTRATOR"
    }

    packagingOptions {
      pickFirst("lib/**/*.so")
    }

  }

}

fun setupAndroidPublishProject(project: Project) = with(project) {
  afterEvaluate {
    val android = extensions.getByType(TestedExtension::class)
    val sourcesJar by tasks.registering(Jar::class) {
      from(android.sourceSets["main"].java.srcDirs)
      archiveClassifier.set("sources")
    }

    artifacts.add("archives", sourcesJar)

    //logger.quiet("Components: ${project.components.size}")
    project.components.forEach { component ->
      logger.quiet("Component: ${component}")
    }

    tasks.withType(Javadoc::class).all {
      enabled = false
    }


    /**
     * Configure publish
     */
    lateinit var publication: MavenPublication

    configure<PublishingExtension> {
      repositories {
        mavenLocal()
      }

      publication = publications.create("${project.name}", MavenPublication::class.java) {
        groupId = GROUP
        artifactId = project.properties["POM_ARTIFACT_ID"] as String
        version = VERSION_NAME

        artifact(tasks.getByName("bundleReleaseAar"))
        artifact(sourcesJar.get())

        pom.withXml {
          asNode().appendNode("dependencies").apply {
            fun Dependency.write(scope: String) = appendNode("dependency").apply {
              appendNode("groupId", if (this@write is ProjectDependency) GROUP else group)
              appendNode("artifactId", name)
              appendNode("version", if (version == null || version == "unspecified")
                VERSION_NAME
              else
                version
              )
              appendNode("scope", scope)
            }

            for (dependency in configurations["api"].dependencies) {
              dependency.write("compile")
            }
            for (dependency in (configurations["compile"].dependencies + configurations["implementation"].dependencies)) {
              dependency.write("runtime")
            }
          }
        }
      }

    }

    //publication.artifact(androidLibraryReleaseAar)

    tasks.withType<AbstractPublishToMaven> {
      dependsOn(
        //tasks.find { "generatePomFileFor${publication.name}Publication".equals(it.name, ignoreCase = true) },
        //tasks.getByName("bundleReleaseAar"),
        tasks.getByName("assembleRelease")
      )


    }
  }

}
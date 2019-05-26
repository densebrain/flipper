@file:Suppress("LocalVariableName")

import com.android.build.gradle.LibraryExtension
import com.android.build.api.dsl.model.BuildType
import com.android.build.gradle.TestedExtension
import com.android.build.gradle.tasks.BundleAar
import com.jfrog.bintray.gradle.BintrayExtension
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
import com.jfrog.bintray.gradle.BintrayPlugin
import com.jfrog.bintray.gradle.tasks.BintrayUploadTask
import org.gradle.plugins.signing.SigningExtension
import org.gradle.plugins.signing.signatory.pgp.PgpSignatoryProvider
import java.io.File
import java.util.*

val Project.androidLibraryReleaseAar
  get() = tasks.getByName<BundleAar>("bundleReleaseAar").archiveFile

val localPropMap = mutableMapOf<Project,Properties>()

val Project.localProps: Properties
  get() = localPropMap.getOrPut(this) {
    val props = Properties()
    val file = File(projectDir,"local.properties")
    if (file.exists()) {
      file.inputStream().use {
        props.load(it)
      }
    }
    props
  }

fun Project.getProjectProperty(vararg names: String): String? {
  for (name in names) {
    if (localProps.containsKey(name))
      return localProps.getProperty(name)

    if (rootProject.localProps.containsKey(name))
      return rootProject.localProps.getProperty(name)

    if (project.hasProperty(name))
      return project.properties[name] as String?

    if (rootProject.hasProperty(name))
      return rootProject.properties[name] as String?
  }

  return null
}

fun getSystemProperty(vararg names: String): String? {
  for (name in names) {
    val value = System.getenv(name)
    if (value != null)
      return value
  }

  return null
}

fun Project.getProperty(systemProps: Array<String>, projectProps: Array<String>, defaultValue: String?): String? {
  return getSystemProperty(*systemProps) ?: getProjectProperty(*projectProps) ?: defaultValue

}

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

fun setupAndroidThirdPartyProject(project: Project) = with(project) {
  val prepareLibs = tasks.getByPath(":common:third-party:prepare")
  tasks.forEach { t ->
    if (t.name.startsWith("externalNative"))
      t.dependsOn(prepareLibs)
  }
  tasks.getByName("preBuild")
    .dependsOn(tasks.getByPath(":common:third-party:prepare"))
}

fun setupAndroidPublishProject(project: Project, shouldPublish: Boolean = false) = with(project) {
  afterEvaluate {
    val android = extensions.getByType(TestedExtension::class)
    val sourcesJar by tasks.registering(Jar::class) {
      from(android.sourceSets["main"].java.srcDirs)
      archiveClassifier.set("sources")
    }

    artifacts.add("archives", sourcesJar)

    project.components.forEach { component ->
      logger.quiet("Component: ${component}")
    }

    tasks.withType(Javadoc::class).all {
      enabled = false
    }

    val POM_ARTIFACT_ID = getProjectProperty("POM_ARTIFACT_ID")
    val POM_DESCRIPTION = getProjectProperty("POM_DESCRIPTION")
    val VERSION_NAME = getProjectProperty("VERSION_NAME")
    val publishedGroupId = getProjectProperty("GROUP")

    /**
     * Configure publish
     */
    lateinit var publication: MavenPublication

    configure<PublishingExtension> {
      repositories {
        mavenLocal()
      }

      publication = publications.create(project.name, MavenPublication::class.java) {
        groupId = publishedGroupId
        artifactId = project.properties["POM_ARTIFACT_ID"] as String
        version = VERSION_NAME

        artifact(tasks.getByName("bundleReleaseAar"))
        artifact(sourcesJar.get())

        pom.withXml {
          asNode().appendNode("dependencies").apply {
            fun Dependency.write(scope: String) = appendNode("dependency").apply {
              appendNode("groupId", if (this@write is ProjectDependency) publishedGroupId else group)
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


    tasks.withType<AbstractPublishToMaven> {
      dependsOn(
        tasks.getByName("assembleRelease")
      )
    }

    if (shouldPublish) {
      BintrayPlugin().apply(this@with)

      rootProject.tasks
        .getByName("publishReleaseArtifacts")
        .dependsOn(tasks.withType(BintrayUploadTask::class))

      configure<BintrayExtension> {
        val skipMavenRepos = gradle.startParameter.taskNames.contains("bintrayUploadAll")


        val bintrayRepo = getProperty(
          arrayOf("bintrayRepo", "BINTRAY_REPO"),
          arrayOf("bintrayRepo", "BINTRAY_REPO"),
          "maven"
        )

        val bintrayUsername = getProperty(
          arrayOf("bintrayUsername", "BINTRAY_USERNAME"),
          arrayOf("bintrayUsername", "BINTRAY_USERNAME"),
          null
        )

        val bintrayUserOrg = getProperty(
          arrayOf("BINTRAY_USER_ORG"),
          arrayOf("bintrayUserOrg", "BINTRAY_USER_ORG"),
          "facebook"
        )

        val bintrayApiKey = getProperty(
          arrayOf("bintrayApiKey", "BINTRAY_API_KEY"),
          arrayOf("bintrayApiKey", "BINTRAY_API_KEY"),
          null
        )
        val bintrayGpgPassword = getProperty(
          arrayOf("bintrayGpgPassword", "BINTRAY_GPG_PASSWORD"),
          arrayOf("bintrayGpgPassword", "BINTRAY_GPG_PASSWORD"),
          null
        )

        val signingKeyringFilename = getProperty(
          arrayOf("signing.secretKeyRingFile"),
          arrayOf("signing.secretKeyRingFile"),
          null
        )


        val signingKeyId = getProperty(
          arrayOf("signing.keyId", "SIGNING_KEY_ID"),
          arrayOf("signing.keyId", "SIGNING_KEY_ID"),
          null
        )

        val signingPassword = getProperty(
          arrayOf("signing.password", "SIGNING_PASSWORD"),
          arrayOf("signing.password", "SIGNING_PASSWORD"),
          bintrayGpgPassword
        )


        val signingReady = signingKeyringFilename != null &&
          File(signingKeyringFilename).exists() &&
          signingKeyId != null &&
          signingPassword != null

        if (signingReady) {
          try {
            project.setProperty("signing.keyId", signingKeyId)
            project.setProperty("signing.password", signingPassword)
            project.setProperty("signing.secretKeyRingFile", signingKeyringFilename)
          } catch (ignored: Throwable) {
          }

//          val signatoryProvider = PgpSignatoryProvider()
//          signatoryProvider.configure(extensions.getByType(SigningExtension::class)) {
////            keyId = signingKeyId
////            password = signingPassword
////            secretKeyringFile = signingKeyringFilename
//          }
//          signing.setSignatories(signatoryProvider)
        }

        val POM_LICENSE_NAME = getProjectProperty("POM_LICENSE_NAME")
        val bintrayName = "${publishedGroupId}:${POM_ARTIFACT_ID}"
        val bintrayDescription = POM_DESCRIPTION
        val projectUrl = getProjectProperty("POM_URL")
        val issuesUrl = "https://github.com/facebook/states/issues"
        val scmUrl = getProjectProperty("POM_SCM_URL")
        val scmConnection = getProjectProperty("POM_SCM_CONNECTION")
        val scmDeveloperConnection = getProjectProperty("POM_SCM_DEV_CONNECTION")


        val developerId = getProjectProperty("POM_DEVELOPER_ID")
        val developerName = getProjectProperty("POM_DEVELOPER_NAME")

//        val projectLicenses = {
//          license {
//            name = POM_LICENSE_NAME
//            url = POM_LICENSE_URL
//            distribution = POM_LICENSE_DIST
//          }
//        }


        fun getMavenCentralUsername(): String? {
          return if (project.hasProperty("mavenCentralUsername")) property("mavenCentralUsername").toString() else System.getenv("MAVEN_CENTRAL_USERNAME")
        }

        fun getMavenCentralPassword(): String {
          return if (project.hasProperty("mavenCentralPassword")) property("mavenCentralPassword").toString() else System.getenv("MAVEN_CENTRAL_PASSWORD")
        }

        fun shouldSyncWithMavenCentral(): Boolean {
          return if (project.hasProperty("syncWithMavenCentral")) property("syncWithMavenCentral").toString().toBoolean() else false
        }

        fun dryRunOnly(): Boolean {
          return if (project.hasProperty("dryRun")) property("dryRun").toString().toBoolean() else false
        }

        if (bintrayUsername != null && bintrayApiKey != null) {
          user = bintrayUsername
          key = bintrayApiKey

          setConfigurations("archives")

          with(pkg) {
            repo = bintrayRepo
            userOrg = bintrayUserOrg
            name = bintrayName
            desc = bintrayDescription
            websiteUrl = projectUrl
            issueTrackerUrl = issuesUrl
            vcsUrl = scmUrl

            setLicenses(POM_LICENSE_NAME)

            dryRun = dryRunOnly()
            override = true
            publish = true
            publicDownloadNumbers = true

            with(version) {
              name = VERSION_NAME
              desc = bintrayDescription

              if (bintrayGpgPassword != null) {
                with(gpg) {
                  sign = true
                  passphrase = bintrayGpgPassword
                }
              }

              if (shouldSyncWithMavenCentral()) {
                with(mavenCentralSync) {
                  sync = true
                  user = getMavenCentralUsername()
                  password = getMavenCentralPassword()
                  close = "1" // If set to 0, you have to manually click release
                }
              }
            }
          }

        }
      }
    }
  }

}
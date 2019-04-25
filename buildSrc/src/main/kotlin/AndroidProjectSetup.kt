import com.android.build.gradle.LibraryExtension
import com.android.build.api.dsl.model.BuildType
import com.android.build.gradle.TestedExtension
import com.android.build.gradle.tasks.BundleAar
import org.gradle.api.Project
import org.gradle.kotlin.dsl.*

fun setupAndroidProject(project:Project) = with(project) {
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

//    afterEvaluate {
//      tasks.withType<BundleAar> {
//        archiveVersion.set(kduxVersion)
//      }
//    }
  }

//  configurations.all {
//    resolutionStrategy {
//      force(
//        Deps.jvm.findBugs
//      )
//    }
//  }
}
import com.android.build.gradle.LibraryExtension
import com.jfrog.bintray.gradle.tasks.BintrayUploadTask
import org.gradle.plugins.ide.idea.model.IdeaModel
import org.gradle.plugins.ide.idea.IdeaPlugin
import org.jetbrains.gradle.ext.ProjectSettings
import org.jetbrains.gradle.ext.TaskTriggersConfig


buildscript {
  repositories {
    mavenLocal()
    google()
    gradlePluginPortal()
    jcenter()
    mavenCentral()
    maven(url = "https://jitpack.io")
    maven(url = "https://dl.bintray.com/kotlin/kotlin-eap")
  }

  dependencies {
    classpath("com.android.tools.build:gradle:${Plugins.Android}")
  }
}


//plugins {
//  id("idea")
//  id("org.jetbrains.gradle.plugin.idea-ext")
//
//}
//
//afterEvaluate {
//  configure<IdeaModel> {
//
//    module {
//
//      excludeDirs.addAll(listOf(".gradle",
//        "classes", "docs", "dependency-cache", "libs", "reports", "resources", "test-results", "tmp",
//        ".cxxpods", "build", "desktop").map {
//        file("${rootDir}/${it}")
//      })
//
//      iml {
//        whenMerged(Action<org.gradle.plugins.ide.idea.model.Module> {
//          excludeDirs.addAll(listOf(".gradle",
//            "classes", "docs", "dependency-cache", "libs", "reports", "resources", "test-results", "tmp",
//            ".cxxpods", "build", "desktop").map {
//            file("${rootDir}/${it}")
//          })
//        })
//      }
//    }
//    val idpSettings = (this@configure.project as ExtensionAware).extensions.getByType<ProjectSettings>()
//    val taskTriggers = (idpSettings as ExtensionAware).extensions.getByType<TaskTriggersConfig>()
//    taskTriggers.afterSync(rootProject.tasks.getByName("moduleSync"))
//  }
//}

// val publishedProjects = mutableListOf<String>()

// tasks.create("publishReleaseArtifacts")

// subprojects {
//   group = getProjectProperty("GROUP") ?: group
// }


// tasks {
//   create("moduleSync") {
//     doFirst {
//       file("${rootDir}/${rootProject.name}.iml").writeText("""
//         <?xml version="1.0" encoding="UTF-8"?>
// <module relativePaths="true" type="JAVA_MODULE" version="4">
//   <component name="FacetManager">
//     <facet type="android-gradle" name="Android-Gradle">
//       <configuration>
//         <option name="GRADLE_PROJECT_PATH" value=":" />
//       </configuration>
//     </facet>
//     <facet type="java-gradle" name="Java-Gradle">
//       <configuration>
//         <option name="BUILD_FOLDER_PATH" value="${'$'}MODULE_DIR${'$'}/build" />
//         <option name="BUILDABLE" value="false" />
//       </configuration>
//     </facet>
//   </component>
//   <component name="NewModuleRootManager" LANGUAGE_LEVEL="JDK_1_7" inherit-compiler-output="true">
//       <exclude-output />
//       <content url="file://${'$'}MODULE_DIR${'$'}/">
//       <excludeFolder url="file://${'$'}MODULE_DIR${'$'}/.gradle"/>
//       <excludeFolder url="file://${'$'}MODULE_DIR${'$'}/build"/>
//       <excludeFolder url="file://${'$'}MODULE_DIR${'$'}/.cxxpods"/>
//       <excludeFolder url="file://${'$'}MODULE_DIR${'$'}/desktop"/>
//     </content>
//       <orderEntry type="inheritedJdk" />
//       <orderEntry type="sourceFolder" forTests="false" />
//     </component>
// </module>


//       """.trimIndent())
//       exec {
//         setCommandLine("rm", "${rootDir}/${rootProject.name}.iml")
//         setWorkingDir(rootDir)

//       }
//     }
//     //finalizedBy("ideaModule")
//   }
// }


//val publishedProjects = mutableListOf<String>()
//
//tasks.create("publishReleaseArtifacts")
//
//subprojects {
//  group = getProjectProperty("GROUP") ?: group
//}
//
//




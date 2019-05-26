import Plugins as ScriptPlugins

object AndroidEnv {
  val minSdkVersion = 16
  val targetSdkVersion = 28
  val compileSdkVersion = 28
  val buildToolsVersion = "28.0.3"
  val sourceCompatibilityVersion = "1.7"//JavaVersion.VERSION_1_7
  val targetCompatibilityVersion = "1.7"//JavaVersion.VERSION_1_7
}

object Versions {
  val Plugins = ScriptPlugins
  val androidXAnnotations = "1.1.0-beta01"
  val androidXAppcompat = "1.1.0-alpha04"
  val androidXLegacyCoreUI = "1.0.0"
  val androidXRecyclerView = "1.1.0-alpha04"

}

object deps {
  // Android support
  val supportAnnotations = "androidx.annotation:annotation:${Versions.androidXAnnotations}"
  val supportAppCompat = "androidx.appcompat:appcompat:${Versions.androidXAppcompat}"
  val supportCoreUi = "androidx.legacy.legacy-support-core-ui:${Versions.androidXLegacyCoreUI}"
  val supportRecyclerView = "androidx.recyclerview:recyclerview:${Versions.androidXRecyclerView}"
  val supportConstraintLayout = "androidx.constraintlayout:constraintlayout:1.1.3"
  val supportEspresso = "androidx.test.espresso:espresso-core:3.1.0"
  val supportDesign = "com.google.android.material:material:1.1.0-alpha05"
  val supportEspressoIntents = "androidx.test.espresso:espresso-intents:3.1.0"
  val supportTestRunner = "androidx.test:runner:1.1.0"

  // Arch
  val archPaging = "android.arch.paging:runtime:1.0.0"

  // First-party
  val soloader = "com.facebook.soloader:soloader:0.6.0"
  val screenshot = "com.facebook.testing.screenshot:core:0.5.0"

  // Annotations
  val jsr305 = "com.google.code.findbugs:jsr305:3.0.1"
  val inferAnnotations = "com.facebook.infer.annotation:infer-annotation:0.11.2"

  // Litho
  val lithoAnnotations = "com.facebook.litho:litho-annotations:$LITHO_VERSION"
  val lithoCore = "com.facebook.litho:litho-core:$LITHO_VERSION"
  val lithoSectionsDebug = "com.facebook.litho:litho-sections-debug:$LITHO_VERSION"
  val lithoSectionsCore = "com.facebook.litho:litho-sections-core:$LITHO_VERSION"
  val lithoWidget = "com.facebook.litho:litho-widget:$LITHO_VERSION"
  val lithoProcessor = "com.facebook.litho:litho-processor:$LITHO_VERSION"
  val lithoFresco = "com.facebook.litho:litho-fresco:$LITHO_VERSION"
  val lithoTesting = "com.facebook.litho:litho-testing:$LITHO_VERSION"

  // Debugging and testing
  val guava = "com.google.guava:guava:20.0"
  val robolectric = "org.robolectric:robolectric:3.3"
  val junit = "junit:junit:4.12"
  val hamcrest = "org.hamcrest:hamcrest-library:1.3"
  val mockito = "org.mockito:mockito-core:1.9.5"
  val stetho = "com.facebook.stetho:stetho:1.5.0"
  val okhttp3 = "com.squareup.okhttp3:okhttp:3.10.0"
  val leakcanary = "com.squareup.leakcanary:leakcanary-android:1.6.3"
  val testCore = "androidx.test:core:1.0.0"
  val testRules = "androidx.test:rules:1.1.0"

  // Plugin dependencies
  val rhino = "org.mozilla:rhino:1.7.10"
  val frescoStates = "com.facebook.fresco:flipper:1.13.0"
  val frescoStetho = "com.facebook.fresco:stetho:1.13.0"
  val fresco = "com.facebook.fresco:fresco:1.13.0"
  val mdns = "com.github.cicdevelopmentnz:Android-MDNS:v0.0.2"
}
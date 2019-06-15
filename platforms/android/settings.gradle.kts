enableFeaturePreview("GRADLE_METADATA")

include(":android-fbjni")
include(":android-stato")
include(":android-sample")

includeBuild("../common/common-stato")

apply(from = "${rootDir}/../../gradle/common.settings.gradle.kts")

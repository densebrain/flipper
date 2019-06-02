/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.fresco.objecthelper

import org.stato.plugins.inspector.InspectorValue.Type

import android.text.TextUtils
import com.facebook.drawee.backends.pipeline.info.ImageOriginUtils
import com.facebook.drawee.backends.pipeline.info.ImagePerfData
import com.facebook.drawee.generic.RoundingParams
import org.stato.core.StatoArray
import org.stato.core.StatoObject
import org.stato.plugins.inspector.InspectorValue
import com.facebook.imagepipeline.common.ImageDecodeOptions
import com.facebook.imagepipeline.common.ResizeOptions
import com.facebook.imagepipeline.common.RotationOptions
import com.facebook.imagepipeline.debug.FlipperImageTracker
import com.facebook.imagepipeline.image.ImageInfo
import com.facebook.imagepipeline.image.QualityInfo
import com.facebook.imagepipeline.request.ImageRequest

/** Serialization helper to create [StatoObject]s.  */
abstract class StatoObjectHelper {

  fun keyValuePair(key: String,  value: String): StatoObject {
    return StatoObject.Builder().put(key, value).build()
  }

  
  fun toStatoObject( stringMap: Map<String, String>?): StatoObject? {
    if (stringMap == null) {
      return null
    }
    val optionsJson = StatoObject.Builder()
    for (entry in stringMap.entries) {
      optionsJson.put(entry.key, entry.value)
    }
    return optionsJson.build()
  }

  
  fun toStatoObject( imageRequest: ImageRequest?): StatoObject? {
    if (imageRequest == null) {
      return null
    }
    val optionsJson = StatoObject.Builder()
    return addImageRequestProperties(optionsJson, imageRequest).build()
  }

  
  fun toStatoObject( imageDebugData: FlipperImageTracker.ImageDebugData?): StatoObject? {
    if (imageDebugData == null) {
      return null
    }
    val optionsJson = StatoObject.Builder()
    optionsJson.put("imageId", imageDebugData.uniqueId)
    optionsJson.put("imageRequest", toStatoObject(imageDebugData.imageRequest))
    optionsJson.put(
      "requestId",
      if (imageDebugData.requestIds != null)
        TextUtils.join(", ", imageDebugData.requestIds!!)
      else
        "")
    optionsJson.put("imagePerfData", toStatoObject(imageDebugData.imagePerfData))
    return optionsJson.build()
  }

  
  fun toStatoObject( options: ImageDecodeOptions?): StatoObject? {
    if (options == null) {
      return null
    }
    val optionsJson = StatoObject.Builder()
    optionsJson.put("minDecodeIntervalMs", options.minDecodeIntervalMs)
    optionsJson.put("decodePreviewFrame", options.decodePreviewFrame)
    optionsJson.put("useLastFrameForPreview", options.useLastFrameForPreview)
    optionsJson.put("decodeAllFrames", options.decodeAllFrames)
    optionsJson.put("forceStaticImage", options.forceStaticImage)
    optionsJson.put("bitmapConfig", options.bitmapConfig.name)
    optionsJson.put(
      "customImageDecoder",
      if (options.customImageDecoder == null) "" else options.customImageDecoder.toString())
    return optionsJson.build()
  }

  
  fun toStatoObject( resizeOptions: ResizeOptions?): StatoObject? {
    if (resizeOptions == null) {
      return null
    }
    val optionsJson = StatoObject.Builder()
    optionsJson.put("width", resizeOptions.width)
    optionsJson.put("height", resizeOptions.height)
    optionsJson.put("maxBitmapSize", resizeOptions.maxBitmapSize)
    optionsJson.put("roundUpFraction", resizeOptions.roundUpFraction)
    return optionsJson.build()
  }

  
  fun toStatoObject( rotationOptions: RotationOptions?): StatoObject? {
    if (rotationOptions == null) {
      return null
    }
    val optionsJson = StatoObject.Builder()
    optionsJson.put("rotationEnabled", rotationOptions.rotationEnabled())
    optionsJson.put("canDeferUntilRendered", rotationOptions.canDeferUntilRendered())
    optionsJson.put("useImageMetadata", rotationOptions.useImageMetadata())
    if (!rotationOptions.useImageMetadata()) {
      optionsJson.put("forcedAngle", rotationOptions.forcedAngle)
    }
    return optionsJson.build()
  }

  
  fun toStatoObject( roundingParams: RoundingParams?): StatoObject? {
    if (roundingParams == null) {
      return null
    }
    val optionsJson = StatoObject.Builder()
    optionsJson.put("borderWidth", roundingParams.borderWidth)
    optionsJson.put("cornersRadii", toSonarArray(roundingParams.cornersRadii))
    optionsJson.put("padding", roundingParams.padding)
    optionsJson.put("roundAsCircle", roundingParams.roundAsCircle)
    optionsJson.put("roundingMethod", roundingParams.roundingMethod)
    optionsJson.put(
      "borderColor", InspectorValue.immutable(Type.Color, roundingParams.borderColor))
    optionsJson.put(
      "overlayColor", InspectorValue.immutable(Type.Color, roundingParams.overlayColor))
    return optionsJson.build()
  }

  
  fun toStatoObject( imagePerfData: ImagePerfData?): StatoObject? {
    if (imagePerfData == null) {
      return null
    }
    val objectJson = StatoObject.Builder()
    objectJson.put("requestId", imagePerfData.requestId)
    objectJson.put("controllerSubmitTimeMs", imagePerfData.controllerSubmitTimeMs)
    objectJson.put("controllerFinalTimeMs", imagePerfData.controllerFinalImageSetTimeMs)
    objectJson.put("imageRequestStartTimeMs", imagePerfData.imageRequestStartTimeMs)
    objectJson.put("imageRequestEndTimeMs", imagePerfData.imageRequestEndTimeMs)
    objectJson.put("imageOrigin", ImageOriginUtils.toString(imagePerfData.imageOrigin))
    objectJson.put("isPrefetch", imagePerfData.isPrefetch)
    objectJson.put("callerContext", imagePerfData.callerContext)
    objectJson.put("imageRequest", toStatoObject(imagePerfData.imageRequest))
    objectJson.put("imageInfo", toStatoObject(imagePerfData.imageInfo))
    return objectJson.build()
  }

  
  fun toStatoObject(imageInfo: ImageInfo?): StatoObject? {
    if (imageInfo == null) {
      return null
    }
    val objectJson = StatoObject.Builder()
    objectJson.put("imageWidth", imageInfo.width)
    objectJson.put("imageHeight", imageInfo.height)
    objectJson.put("qualityInfo", toStatoObject(imageInfo.qualityInfo))
    return objectJson.build()
  }

  
  fun toStatoObject(qualityInfo: QualityInfo?): StatoObject? {
    if (qualityInfo == null) {
      return null
    }
    val objectJson = StatoObject.Builder()
    objectJson.put("quality", qualityInfo.quality)
    objectJson.put("isGoodEnoughQuality", qualityInfo.isOfGoodEnoughQuality)
    objectJson.put("isFullQuality", qualityInfo.isOfFullQuality)
    return objectJson.build()
  }

  fun addImageRequestProperties(
    builder: StatoObject.Builder,  request: ImageRequest?): StatoObject.Builder {
    if (request == null) {
      return builder
    }
    builder
      .put("sourceUri", request.sourceUri)
      .put("preferredWidth", request.preferredWidth)
      .put("preferredHeight", request.preferredHeight)
      .put("cacheChoice", request.cacheChoice)
      .put("diskCacheEnabled", request.isDiskCacheEnabled)
      .put("localThumbnailPreviewsEnabled", request.localThumbnailPreviewsEnabled)
      .put("lowestPermittedRequestLevel", request.lowestPermittedRequestLevel)
      .put("priority", request.priority.name)
      .put("progressiveRenderingEnabled", request.progressiveRenderingEnabled)
      .put("postprocessor", request.postprocessor.toString())
      .put("requestListener", request.requestListener.toString())
      .put("imageDecodeOptions", toStatoObject(request.imageDecodeOptions))
      .put("bytesRange", request.bytesRange)
      .put("resizeOptions", toStatoObject(request.resizeOptions))
      .put("rotationOptions", toStatoObject(request.rotationOptions))
    return builder
  }

  private fun toSonarArray(floats: FloatArray): StatoArray {
    val builder = StatoArray.Builder()
    for (f in floats) {
      builder.put(f)
    }
    return builder.build()
  }

  
  abstract fun fromCallerContext( callerContext: Any): StatoArray
}

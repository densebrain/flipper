/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.fresco.objecthelper;

import static com.facebook.stato.plugins.inspector.InspectorValue.Type.Color;

import android.text.TextUtils;
import com.facebook.drawee.backends.pipeline.info.ImageOriginUtils;
import com.facebook.drawee.backends.pipeline.info.ImagePerfData;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.plugins.inspector.InspectorValue;
import com.facebook.imagepipeline.common.ImageDecodeOptions;
import com.facebook.imagepipeline.common.ResizeOptions;
import com.facebook.imagepipeline.common.RotationOptions;
import com.facebook.imagepipeline.debug.FlipperImageTracker;
import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.imagepipeline.image.QualityInfo;
import com.facebook.imagepipeline.request.ImageRequest;
import java.util.Map;
import javax.annotation.Nullable;

/** Serialization helper to create {@link StatoObject}s. */
public abstract class StatoObjectHelper {

  public StatoObject keyValuePair(String key, @Nullable String value) {
    return new StatoObject.Builder().put(key, value).build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable Map<String, String> stringMap) {
    if (stringMap == null) {
      return null;
    }
    StatoObject.Builder optionsJson = new StatoObject.Builder();
    for (Map.Entry<String, String> entry : stringMap.entrySet()) {
      optionsJson.put(entry.getKey(), entry.getValue());
    }
    return optionsJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable ImageRequest imageRequest) {
    if (imageRequest == null) {
      return null;
    }
    StatoObject.Builder optionsJson = new StatoObject.Builder();
    return addImageRequestProperties(optionsJson, imageRequest).build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable FlipperImageTracker.ImageDebugData imageDebugData) {
    if (imageDebugData == null) {
      return null;
    }
    StatoObject.Builder optionsJson = new StatoObject.Builder();
    optionsJson.put("imageId", imageDebugData.getUniqueId());
    optionsJson.put("imageRequest", toStatoObject(imageDebugData.getImageRequest()));
    optionsJson.put(
        "requestId",
        imageDebugData.getRequestIds() != null
            ? TextUtils.join(", ", imageDebugData.getRequestIds())
            : "");
    optionsJson.put("imagePerfData", toStatoObject(imageDebugData.getImagePerfData()));
    return optionsJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable ImageDecodeOptions options) {
    if (options == null) {
      return null;
    }
    StatoObject.Builder optionsJson = new StatoObject.Builder();
    optionsJson.put("minDecodeIntervalMs", options.minDecodeIntervalMs);
    optionsJson.put("decodePreviewFrame", options.decodePreviewFrame);
    optionsJson.put("useLastFrameForPreview", options.useLastFrameForPreview);
    optionsJson.put("decodeAllFrames", options.decodeAllFrames);
    optionsJson.put("forceStaticImage", options.forceStaticImage);
    optionsJson.put("bitmapConfig", options.bitmapConfig.name());
    optionsJson.put(
        "customImageDecoder",
        options.customImageDecoder == null ? "" : options.customImageDecoder.toString());
    return optionsJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable ResizeOptions resizeOptions) {
    if (resizeOptions == null) {
      return null;
    }
    StatoObject.Builder optionsJson = new StatoObject.Builder();
    optionsJson.put("width", resizeOptions.width);
    optionsJson.put("height", resizeOptions.height);
    optionsJson.put("maxBitmapSize", resizeOptions.maxBitmapSize);
    optionsJson.put("roundUpFraction", resizeOptions.roundUpFraction);
    return optionsJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable RotationOptions rotationOptions) {
    if (rotationOptions == null) {
      return null;
    }
    StatoObject.Builder optionsJson = new StatoObject.Builder();
    optionsJson.put("rotationEnabled", rotationOptions.rotationEnabled());
    optionsJson.put("canDeferUntilRendered", rotationOptions.canDeferUntilRendered());
    optionsJson.put("useImageMetadata", rotationOptions.useImageMetadata());
    if (!rotationOptions.useImageMetadata()) {
      optionsJson.put("forcedAngle", rotationOptions.getForcedAngle());
    }
    return optionsJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable RoundingParams roundingParams) {
    if (roundingParams == null) {
      return null;
    }
    StatoObject.Builder optionsJson = new StatoObject.Builder();
    optionsJson.put("borderWidth", roundingParams.getBorderWidth());
    optionsJson.put("cornersRadii", toSonarArray(roundingParams.getCornersRadii()));
    optionsJson.put("padding", roundingParams.getPadding());
    optionsJson.put("roundAsCircle", roundingParams.getRoundAsCircle());
    optionsJson.put("roundingMethod", roundingParams.getRoundingMethod());
    optionsJson.put(
        "borderColor", InspectorValue.immutable(Color, roundingParams.getBorderColor()));
    optionsJson.put(
        "overlayColor", InspectorValue.immutable(Color, roundingParams.getOverlayColor()));
    return optionsJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(@Nullable ImagePerfData imagePerfData) {
    if (imagePerfData == null) {
      return null;
    }
    StatoObject.Builder objectJson = new StatoObject.Builder();
    objectJson.put("requestId", imagePerfData.getRequestId());
    objectJson.put("controllerSubmitTimeMs", imagePerfData.getControllerSubmitTimeMs());
    objectJson.put("controllerFinalTimeMs", imagePerfData.getControllerFinalImageSetTimeMs());
    objectJson.put("imageRequestStartTimeMs", imagePerfData.getImageRequestStartTimeMs());
    objectJson.put("imageRequestEndTimeMs", imagePerfData.getImageRequestEndTimeMs());
    objectJson.put("imageOrigin", ImageOriginUtils.toString(imagePerfData.getImageOrigin()));
    objectJson.put("isPrefetch", imagePerfData.isPrefetch());
    objectJson.put("callerContext", imagePerfData.getCallerContext());
    objectJson.put("imageRequest", toStatoObject(imagePerfData.getImageRequest()));
    objectJson.put("imageInfo", toStatoObject(imagePerfData.getImageInfo()));
    return objectJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(ImageInfo imageInfo) {
    if (imageInfo == null) {
      return null;
    }
    StatoObject.Builder objectJson = new StatoObject.Builder();
    objectJson.put("imageWidth", imageInfo.getWidth());
    objectJson.put("imageHeight", imageInfo.getHeight());
    objectJson.put("qualityInfo", toStatoObject(imageInfo.getQualityInfo()));
    return objectJson.build();
  }

  @Nullable
  public StatoObject toStatoObject(QualityInfo qualityInfo) {
    if (qualityInfo == null) {
      return null;
    }
    StatoObject.Builder objectJson = new StatoObject.Builder();
    objectJson.put("quality", qualityInfo.getQuality());
    objectJson.put("isGoodEnoughQuality", qualityInfo.isOfGoodEnoughQuality());
    objectJson.put("isFullQuality", qualityInfo.isOfFullQuality());
    return objectJson.build();
  }

  public StatoObject.Builder addImageRequestProperties(
      StatoObject.Builder builder, @Nullable ImageRequest request) {
    if (request == null) {
      return builder;
    }
    builder
        .put("sourceUri", request.getSourceUri())
        .put("preferredWidth", request.getPreferredWidth())
        .put("preferredHeight", request.getPreferredHeight())
        .put("cacheChoice", request.getCacheChoice())
        .put("diskCacheEnabled", request.isDiskCacheEnabled())
        .put("localThumbnailPreviewsEnabled", request.getLocalThumbnailPreviewsEnabled())
        .put("lowestPermittedRequestLevel", request.getLowestPermittedRequestLevel())
        .put("priority", request.getPriority().name())
        .put("progressiveRenderingEnabled", request.getProgressiveRenderingEnabled())
        .put("postprocessor", String.valueOf(request.getPostprocessor()))
        .put("requestListener", String.valueOf(request.getRequestListener()))
        .put("imageDecodeOptions", toStatoObject(request.getImageDecodeOptions()))
        .put("bytesRange", request.getBytesRange())
        .put("resizeOptions", toStatoObject(request.getResizeOptions()))
        .put("rotationOptions", toStatoObject(request.getRotationOptions()));
    return builder;
  }

  private StatoArray toSonarArray(float[] floats) {
    final StatoArray.Builder builder = new StatoArray.Builder();
    for (float f : floats) {
      builder.put(f);
    }
    return builder.build();
  }

  @Nullable
  public abstract StatoArray fromCallerContext(@Nullable Object callerContext);
}

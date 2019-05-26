/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.fresco.objecthelper;

import static com.facebook.states.plugins.inspector.InspectorValue.Type.Color;

import android.text.TextUtils;
import com.facebook.drawee.backends.pipeline.info.ImageOriginUtils;
import com.facebook.drawee.backends.pipeline.info.ImagePerfData;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesObject;
import com.facebook.states.plugins.inspector.InspectorValue;
import com.facebook.imagepipeline.common.ImageDecodeOptions;
import com.facebook.imagepipeline.common.ResizeOptions;
import com.facebook.imagepipeline.common.RotationOptions;
import com.facebook.imagepipeline.debug.FlipperImageTracker;
import com.facebook.imagepipeline.image.ImageInfo;
import com.facebook.imagepipeline.image.QualityInfo;
import com.facebook.imagepipeline.request.ImageRequest;
import java.util.Map;
import javax.annotation.Nullable;

/** Serialization helper to create {@link StatesObject}s. */
public abstract class StatesObjectHelper {

  public StatesObject keyValuePair(String key, @Nullable String value) {
    return new StatesObject.Builder().put(key, value).build();
  }

  @Nullable
  public StatesObject toStatesObject(@Nullable Map<String, String> stringMap) {
    if (stringMap == null) {
      return null;
    }
    StatesObject.Builder optionsJson = new StatesObject.Builder();
    for (Map.Entry<String, String> entry : stringMap.entrySet()) {
      optionsJson.put(entry.getKey(), entry.getValue());
    }
    return optionsJson.build();
  }

  @Nullable
  public StatesObject toStatesObject(@Nullable ImageRequest imageRequest) {
    if (imageRequest == null) {
      return null;
    }
    StatesObject.Builder optionsJson = new StatesObject.Builder();
    return addImageRequestProperties(optionsJson, imageRequest).build();
  }

  @Nullable
  public StatesObject toStatesObject(@Nullable FlipperImageTracker.ImageDebugData imageDebugData) {
    if (imageDebugData == null) {
      return null;
    }
    StatesObject.Builder optionsJson = new StatesObject.Builder();
    optionsJson.put("imageId", imageDebugData.getUniqueId());
    optionsJson.put("imageRequest", toStatesObject(imageDebugData.getImageRequest()));
    optionsJson.put(
        "requestId",
        imageDebugData.getRequestIds() != null
            ? TextUtils.join(", ", imageDebugData.getRequestIds())
            : "");
    optionsJson.put("imagePerfData", toStatesObject(imageDebugData.getImagePerfData()));
    return optionsJson.build();
  }

  @Nullable
  public StatesObject toStatesObject(@Nullable ImageDecodeOptions options) {
    if (options == null) {
      return null;
    }
    StatesObject.Builder optionsJson = new StatesObject.Builder();
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
  public StatesObject toStatesObject(@Nullable ResizeOptions resizeOptions) {
    if (resizeOptions == null) {
      return null;
    }
    StatesObject.Builder optionsJson = new StatesObject.Builder();
    optionsJson.put("width", resizeOptions.width);
    optionsJson.put("height", resizeOptions.height);
    optionsJson.put("maxBitmapSize", resizeOptions.maxBitmapSize);
    optionsJson.put("roundUpFraction", resizeOptions.roundUpFraction);
    return optionsJson.build();
  }

  @Nullable
  public StatesObject toStatesObject(@Nullable RotationOptions rotationOptions) {
    if (rotationOptions == null) {
      return null;
    }
    StatesObject.Builder optionsJson = new StatesObject.Builder();
    optionsJson.put("rotationEnabled", rotationOptions.rotationEnabled());
    optionsJson.put("canDeferUntilRendered", rotationOptions.canDeferUntilRendered());
    optionsJson.put("useImageMetadata", rotationOptions.useImageMetadata());
    if (!rotationOptions.useImageMetadata()) {
      optionsJson.put("forcedAngle", rotationOptions.getForcedAngle());
    }
    return optionsJson.build();
  }

  @Nullable
  public StatesObject toStatesObject(@Nullable RoundingParams roundingParams) {
    if (roundingParams == null) {
      return null;
    }
    StatesObject.Builder optionsJson = new StatesObject.Builder();
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
  public StatesObject toStatesObject(@Nullable ImagePerfData imagePerfData) {
    if (imagePerfData == null) {
      return null;
    }
    StatesObject.Builder objectJson = new StatesObject.Builder();
    objectJson.put("requestId", imagePerfData.getRequestId());
    objectJson.put("controllerSubmitTimeMs", imagePerfData.getControllerSubmitTimeMs());
    objectJson.put("controllerFinalTimeMs", imagePerfData.getControllerFinalImageSetTimeMs());
    objectJson.put("imageRequestStartTimeMs", imagePerfData.getImageRequestStartTimeMs());
    objectJson.put("imageRequestEndTimeMs", imagePerfData.getImageRequestEndTimeMs());
    objectJson.put("imageOrigin", ImageOriginUtils.toString(imagePerfData.getImageOrigin()));
    objectJson.put("isPrefetch", imagePerfData.isPrefetch());
    objectJson.put("callerContext", imagePerfData.getCallerContext());
    objectJson.put("imageRequest", toStatesObject(imagePerfData.getImageRequest()));
    objectJson.put("imageInfo", toStatesObject(imagePerfData.getImageInfo()));
    return objectJson.build();
  }

  @Nullable
  public StatesObject toStatesObject(ImageInfo imageInfo) {
    if (imageInfo == null) {
      return null;
    }
    StatesObject.Builder objectJson = new StatesObject.Builder();
    objectJson.put("imageWidth", imageInfo.getWidth());
    objectJson.put("imageHeight", imageInfo.getHeight());
    objectJson.put("qualityInfo", toStatesObject(imageInfo.getQualityInfo()));
    return objectJson.build();
  }

  @Nullable
  public StatesObject toStatesObject(QualityInfo qualityInfo) {
    if (qualityInfo == null) {
      return null;
    }
    StatesObject.Builder objectJson = new StatesObject.Builder();
    objectJson.put("quality", qualityInfo.getQuality());
    objectJson.put("isGoodEnoughQuality", qualityInfo.isOfGoodEnoughQuality());
    objectJson.put("isFullQuality", qualityInfo.isOfFullQuality());
    return objectJson.build();
  }

  public StatesObject.Builder addImageRequestProperties(
      StatesObject.Builder builder, @Nullable ImageRequest request) {
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
        .put("imageDecodeOptions", toStatesObject(request.getImageDecodeOptions()))
        .put("bytesRange", request.getBytesRange())
        .put("resizeOptions", toStatesObject(request.getResizeOptions()))
        .put("rotationOptions", toStatesObject(request.getRotationOptions()));
    return builder;
  }

  private StatesArray toSonarArray(float[] floats) {
    final StatesArray.Builder builder = new StatesArray.Builder();
    for (float f : floats) {
      builder.put(f);
    }
    return builder.build();
  }

  @Nullable
  public abstract StatesArray fromCallerContext(@Nullable Object callerContext);
}

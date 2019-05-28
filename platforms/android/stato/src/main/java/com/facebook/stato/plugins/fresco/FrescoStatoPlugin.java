/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.stato.plugins.fresco;

import android.graphics.Bitmap;
import android.util.Base64;
import com.facebook.cache.common.CacheKey;
import com.facebook.common.internal.Predicate;
import com.facebook.common.memory.manager.DebugMemoryManager;
import com.facebook.common.memory.manager.NoOpDebugMemoryManager;
import com.facebook.common.references.CloseableReference;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.drawee.backends.pipeline.info.ImageLoadStatus;
import com.facebook.drawee.backends.pipeline.info.ImageOriginUtils;
import com.facebook.drawee.backends.pipeline.info.ImagePerfData;
import com.facebook.drawee.backends.pipeline.info.ImagePerfDataListener;
import com.facebook.imagepipeline.debug.FlipperImageTracker;
import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import com.facebook.stato.perflogger.StatoPerfLogger;
import com.facebook.stato.perflogger.NoOpStatoPerfLogger;
import com.facebook.stato.plugins.common.BufferingStatoPlugin;
import com.facebook.stato.plugins.fresco.objecthelper.StatoObjectHelper;
import com.facebook.imagepipeline.bitmaps.PlatformBitmapFactory;
import com.facebook.imagepipeline.cache.CountingMemoryCacheInspector;
import com.facebook.imagepipeline.cache.CountingMemoryCacheInspector.DumpInfoEntry;
import com.facebook.imagepipeline.core.ImagePipelineFactory;
import com.facebook.imagepipeline.debug.DebugImageTracker;
import com.facebook.imagepipeline.image.CloseableBitmap;
import com.facebook.imagepipeline.image.CloseableImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import javax.annotation.Nullable;

/**
 * Allows Sonar to display the contents of Fresco's caches. This is useful for developers to debug
 * what images are being held in cache as they navigate through their app.
 */
public class FrescoStatoPlugin extends BufferingStatoPlugin implements ImagePerfDataListener {

  private static final String FRESCO_EVENT = "events";
  private static final String FRESCO_DEBUGOVERLAY_EVENT = "debug_overlay_event";

  private static final int BITMAP_PREVIEW_WIDTH = 150;
  private static final int BITMAP_PREVIEW_HEIGHT = 150;
  private static final int BITMAP_SCALING_THRESHOLD_WIDTH = 200;
  private static final int BITMAP_SCALING_THRESHOLD_HEIGHT = 200;

  /** Helper for clearing cache. */
  private static final Predicate<CacheKey> ALWAYS_TRUE_PREDICATE =
      new Predicate<CacheKey>() {
        @Override
        public boolean apply(CacheKey cacheKey) {
          return true;
        }
      };

  private final FlipperImageTracker mStatoImageTracker;
  private final PlatformBitmapFactory mPlatformBitmapFactory;
  @Nullable private final StatoObjectHelper mSonarObjectHelper;
  private final DebugMemoryManager mMemoryManager;
  private final StatoPerfLogger mPerfLogger;
  @Nullable private final FrescoStatoDebugPrefHelper mDebugPrefHelper;

  public FrescoStatoPlugin(
      DebugImageTracker imageTracker,
      PlatformBitmapFactory bitmapFactory,
      @Nullable StatoObjectHelper statoObjectHelper,
      DebugMemoryManager memoryManager,
      StatoPerfLogger perfLogger,
      @Nullable FrescoStatoDebugPrefHelper debugPrefHelper) {
    mStatoImageTracker =
        imageTracker instanceof FlipperImageTracker
            ? (FlipperImageTracker) imageTracker
            : new FlipperImageTracker();
    mPlatformBitmapFactory = bitmapFactory;
    mSonarObjectHelper = statoObjectHelper;
    mMemoryManager = memoryManager;
    mPerfLogger = perfLogger;
    mDebugPrefHelper = debugPrefHelper;
  }

  public FrescoStatoPlugin() {
    this(
        new FlipperImageTracker(),
        Fresco.getImagePipelineFactory().getPlatformBitmapFactory(),
        null,
        new NoOpDebugMemoryManager(),
        new NoOpStatoPerfLogger(),
        null);
  }

  public FlipperImageTracker getStatoImageTracker() {
    return mStatoImageTracker;
  }

  @Override
  public String getId() {
    return "@stato/plugin-fresco";
  }

  @Override
  public void onConnect(StatoConnection connection) {
    super.onConnect(connection);

    connection.receive(
        "listImages",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) throws Exception {
            if (!ensureFrescoInitialized(responder)) {
              return;
            }

            mPerfLogger.startMarker("Sonar.Fresco.listImages");
            final ImagePipelineFactory imagePipelineFactory = Fresco.getImagePipelineFactory();
            final CountingMemoryCacheInspector.DumpInfo memoryCache =
                new CountingMemoryCacheInspector<>(
                        imagePipelineFactory.getBitmapCountingMemoryCache())
                    .dumpCacheContent();

            responder.success(
                new StatoObject.Builder()
                    .put(
                        "levels",
                        new StatoArray.Builder()
                            .put(
                                new StatoObject.Builder()
                                    .put("cacheType", "On screen bitmaps")
                                    .put("sizeBytes", memoryCache.size - memoryCache.lruSize)
                                    .put("imageIds", buildImageIdList(memoryCache.sharedEntries))
                                    .build())
                            .put(
                                new StatoObject.Builder()
                                    .put("cacheType", "Bitmap memory cache")
                                    .put("clearKey", "memory")
                                    .put("sizeBytes", memoryCache.size)
                                    .put("maxSizeBytes", memoryCache.maxSize)
                                    .put("imageIds", buildImageIdList(memoryCache.lruEntries))
                                    .build())
                            // TODO (t31947642): list images on disk
                            .build())
                    .build());
            mPerfLogger.endMarker("Sonar.Fresco.listImages");
          }
        });

    connection.receive(
        "getImage",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, final StatoResponder responder)
              throws Exception {
            if (!ensureFrescoInitialized(responder)) {
              return;
            }

            mPerfLogger.startMarker("Sonar.Fresco.getImage");
            String imageId = params.getString("imageId");
            CacheKey cacheKey = mStatoImageTracker.getCacheKey(imageId);
            if (cacheKey == null) {
              respondError(responder, "ImageId " + imageId + " was evicted from cache");
              mPerfLogger.cancelMarker("Sonar.Fresco.getImage");
              return;
            }
            final ImagePipelineFactory imagePipelineFactory = Fresco.getImagePipelineFactory();
            CloseableReference<CloseableImage> ref =
                imagePipelineFactory.getBitmapCountingMemoryCache().get(cacheKey);
            if (ref == null) {
              respondError(responder, "no bitmap withId=" + imageId);
              mPerfLogger.cancelMarker("Sonar.Fresco.getImage");
              return;
            }
            final CloseableBitmap bitmap = (CloseableBitmap) ref.get();
            String encodedBitmap =
                bitmapToBase64Preview(bitmap.getUnderlyingBitmap(), mPlatformBitmapFactory);

            responder.success(
                new StatoObject.Builder()
                    .put("imageId", imageId)
                    .put("uri", mStatoImageTracker.getUriString(cacheKey))
                    .put("width", bitmap.getWidth())
                    .put("height", bitmap.getHeight())
                    .put("sizeBytes", bitmap.getSizeInBytes())
                    .put("data", encodedBitmap)
                    .build());

            mPerfLogger.endMarker("Sonar.Fresco.getImage");
          }
        });

    connection.receive(
        "clear",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) {
            if (!ensureFrescoInitialized(responder)) {
              return;
            }

            mPerfLogger.startMarker("Sonar.Fresco.clear");
            final String type = params.getString("type");
            switch (type) {
              case "memory":
                final ImagePipelineFactory imagePipelineFactory = Fresco.getImagePipelineFactory();
                imagePipelineFactory.getBitmapMemoryCache().removeAll(ALWAYS_TRUE_PREDICATE);
                break;
              case "disk":
                Fresco.getImagePipeline().clearDiskCaches();
                break;
            }
            mPerfLogger.endMarker("Sonar.Fresco.clear");
          }
        });

    connection.receive(
        "trimMemory",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) throws Exception {
            if (!ensureFrescoInitialized(responder)) {
              return;
            }

            if (mMemoryManager != null) {
              mMemoryManager.trimMemory(
                  DebugMemoryManager.ON_SYSTEM_LOW_MEMORY_WHILE_APP_IN_FOREGROUND);
            }
          }
        });

    connection.receive(
        "enableDebugOverlay",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) throws Exception {
            if (!ensureFrescoInitialized(responder)) {
              return;
            }

            final boolean enabled = params.getBoolean("enabled");
            if (mDebugPrefHelper != null) {
              mDebugPrefHelper.setDebugOverlayEnabled(enabled);
            }
          }
        });

    if (mDebugPrefHelper != null) {
      mDebugPrefHelper.setDebugOverlayEnabledListener(
          new FrescoStatoDebugPrefHelper.Listener() {
            @Override
            public void onEnabledStatusChanged(boolean enabled) {
              sendDebugOverlayEnabledEvent(enabled);
            }
          });
      sendDebugOverlayEnabledEvent(mDebugPrefHelper.isDebugOverlayEnabled());
    }
  }

  private boolean ensureFrescoInitialized(StatoResponder responder) {
    mPerfLogger.startMarker("Sonar.Fresco.ensureFrescoInitialized");
    try {
      Fresco.getImagePipelineFactory();
      return true;
    } catch (NullPointerException e) {
      respondError(responder, "Fresco is not initialized yet");
      return false;
    } finally {
      mPerfLogger.endMarker("Sonar.Fresco.ensureFrescoInitialized");
    }
  }

  private StatoArray buildImageIdList(List<DumpInfoEntry<CacheKey, CloseableImage>> images) {

    StatoArray.Builder builder = new StatoArray.Builder();
    for (DumpInfoEntry<CacheKey, CloseableImage> entry : images) {
      final FlipperImageTracker.ImageDebugData imageDebugData =
          mStatoImageTracker.getImageDebugData(entry.key);

      if (imageDebugData == null) {
        builder.put(mStatoImageTracker.trackImage(entry.key).getUniqueId());
      } else {
        builder.put(imageDebugData.getUniqueId());
      }
    }
    return builder.build();
  }

  private String bitmapToBase64Preview(Bitmap bitmap, PlatformBitmapFactory bitmapFactory) {
    if (bitmap.getWidth() < BITMAP_SCALING_THRESHOLD_WIDTH
        && bitmap.getHeight() < BITMAP_SCALING_THRESHOLD_HEIGHT) {
      return bitmapToBase64WithoutScaling(bitmap);
    }
    mPerfLogger.startMarker("Sonar.Fresco.bitmap2base64-resize");

    // TODO (t19034797): properly load images
    CloseableReference<Bitmap> scaledBitmapReference = null;
    try {
      float previewAspectRatio = BITMAP_PREVIEW_WIDTH / BITMAP_PREVIEW_HEIGHT;
      float imageAspectRatio = bitmap.getWidth() / bitmap.getHeight();

      int scaledWidth;
      int scaledHeight;
      if (previewAspectRatio > imageAspectRatio) {
        scaledWidth = bitmap.getWidth() * BITMAP_PREVIEW_HEIGHT / bitmap.getHeight();
        scaledHeight = BITMAP_PREVIEW_HEIGHT;
      } else {
        scaledWidth = BITMAP_PREVIEW_WIDTH;
        scaledHeight = bitmap.getHeight() * BITMAP_PREVIEW_WIDTH / bitmap.getWidth();
      }
      scaledBitmapReference =
          bitmapFactory.createScaledBitmap(bitmap, scaledWidth, scaledHeight, false);
      return bitmapToBase64WithoutScaling(scaledBitmapReference.get());
    } finally {
      CloseableReference.closeSafely(scaledBitmapReference);
      mPerfLogger.endMarker("Sonar.Fresco.bitmap2base64-resize");
    }
  }

  private String bitmapToBase64WithoutScaling(Bitmap bitmap) {
    mPerfLogger.startMarker("Sonar.Fresco.bitmap2base64-orig");
    ByteArrayOutputStream byteArrayOutputStream = null;
    try {
      byteArrayOutputStream = new ByteArrayOutputStream();
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);

      return "data:image/png;base64,"
          + Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.DEFAULT);
    } finally {
      if (byteArrayOutputStream != null) {
        try {
          byteArrayOutputStream.close();
        } catch (IOException e) {
          // ignore
        }
      }
      mPerfLogger.endMarker("Sonar.Fresco.bitmap2base64-orig");
    }
  }

  public void onImageLoadStatusUpdated(
      ImagePerfData imagePerfData, @ImageLoadStatus int imageLoadStatus) {
    if (imageLoadStatus != ImageLoadStatus.SUCCESS) {
      return;
    }

    String requestId = imagePerfData.getRequestId();
    if (requestId == null) {
      return;
    }

    FlipperImageTracker.ImageDebugData data = mStatoImageTracker.getDebugDataForRequestId(requestId);
    if (data == null) {
      return;
    }

    StatoArray.Builder imageIdsBuilder = new StatoArray.Builder();
    Set<CacheKey> cks = data.getCacheKeys();
    if (cks != null) {
      for (CacheKey ck : cks) {
        FlipperImageTracker.ImageDebugData d = mStatoImageTracker.getImageDebugData(ck);
        if (d != null) {
          imageIdsBuilder.put(d.getUniqueId());
        }
      }
    } else {
      imageIdsBuilder.put(data.getUniqueId());
    }

    StatoArray attribution;
    Object callerContext = imagePerfData.getCallerContext();
    if (callerContext == null) {
      attribution = new StatoArray.Builder().put("unknown").build();
    } else if (mSonarObjectHelper == null) {
      attribution = new StatoArray.Builder().put(callerContext.toString()).build();
    } else {
      attribution = mSonarObjectHelper.fromCallerContext(callerContext);
    }

    StatoObject.Builder response =
        new StatoObject.Builder()
            .put("imageIds", imageIdsBuilder.build())
            .put("attribution", attribution)
            .put("startTime", imagePerfData.getControllerSubmitTimeMs())
            .put("endTime", imagePerfData.getControllerFinalImageSetTimeMs())
            .put("source", ImageOriginUtils.toString(imagePerfData.getImageOrigin()));

    if (!imagePerfData.isPrefetch()) {
      response.put(
          "viewport",
          new StatoObject.Builder()
              // TODO (t31947746): scan times
              .put("width", imagePerfData.getOnScreenWidthPx())
              .put("height", imagePerfData.getOnScreenHeightPx())
              .build());
    }

    send(FRESCO_EVENT, response.build());
  }

  public void onImageVisibilityUpdated(ImagePerfData imagePerfData, int visibilityState) {
    // ignored
  }

  public void sendDebugOverlayEnabledEvent(final boolean enabled) {
    final StatoObject.Builder builder = new StatoObject.Builder().put("enabled", enabled);
    send(FRESCO_DEBUGOVERLAY_EVENT, builder.build());
  }

  private static void respondError(StatoResponder responder, String errorReason) {
    responder.error(new StatoObject.Builder().put("reason", errorReason).build());
  }
}

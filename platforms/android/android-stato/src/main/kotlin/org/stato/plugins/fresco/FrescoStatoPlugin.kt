/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.plugins.fresco

import android.graphics.Bitmap
import android.util.Base64
import com.facebook.cache.common.CacheKey
import com.facebook.common.internal.Predicate
import com.facebook.common.memory.manager.DebugMemoryManager
import com.facebook.common.memory.manager.NoOpDebugMemoryManager
import com.facebook.common.memory.manager.ON_SYSTEM_LOW_MEMORY_WHILE_APP_IN_FOREGROUND
import com.facebook.common.references.CloseableReference
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.drawee.backends.pipeline.info.ImageLoadStatus
import com.facebook.drawee.backends.pipeline.info.ImageOriginUtils
import com.facebook.drawee.backends.pipeline.info.ImagePerfData
import com.facebook.drawee.backends.pipeline.info.ImagePerfDataListener
import com.facebook.imagepipeline.bitmaps.PlatformBitmapFactory
import com.facebook.imagepipeline.cache.CountingMemoryCacheInspector
import com.facebook.imagepipeline.cache.CountingMemoryCacheInspector.DumpInfo
import com.facebook.imagepipeline.cache.CountingMemoryCacheInspector.DumpInfoEntry
import com.facebook.imagepipeline.debug.DebugImageTracker
import com.facebook.imagepipeline.debug.FlipperImageTracker
import com.facebook.imagepipeline.image.CloseableBitmap
import com.facebook.imagepipeline.image.CloseableImage
import org.stato.core.StatoArray
import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoResponder
import org.stato.perflogger.NoOpStatoPerfLogger
import org.stato.perflogger.StatoPerfLogger
import org.stato.plugins.common.BufferingStatoPlugin
import org.stato.plugins.fresco.objecthelper.StatoObjectHelper
import java.io.ByteArrayOutputStream
import java.io.IOException

/**
 * Allows Sonar to display the contents of Fresco's caches. This is useful for developers to debug
 * what images are being held in cache as they navigate through their app.
 */
class FrescoStatoPlugin(
  imageTracker: DebugImageTracker = FlipperImageTracker(),
  private val platformBitmapFactory: PlatformBitmapFactory = Fresco.getImagePipelineFactory().platformBitmapFactory,
  private val mSonarObjectHelper: StatoObjectHelper? = null,
  private val mMemoryManager: DebugMemoryManager? = NoOpDebugMemoryManager(),
  private val perfLogger: StatoPerfLogger = NoOpStatoPerfLogger(),
  private val debugPrefHelper: FrescoStatoDebugPrefHelper? = null
) : BufferingStatoPlugin(), ImagePerfDataListener {

  val statoImageTracker: FlipperImageTracker = if (imageTracker is FlipperImageTracker)
    imageTracker
  else
    FlipperImageTracker()

  override val id = "@stato/plugin-fresco"

  @Suppress("UNCHECKED_CAST")
  override fun onConnect(connection: StatoPluginConnection) {
    super.onConnect(connection)

    connection.receive("listImages") { _: StatoObject, responder: StatoResponder ->
      if (!ensureFrescoInitialized(responder)) {
        return@receive
      }

      perfLogger.startMarker("Sonar.Fresco.listImages")
      val imagePipelineFactory = Fresco.getImagePipelineFactory()
      val memoryCache = CountingMemoryCacheInspector(
        imagePipelineFactory.bitmapCountingMemoryCache)
        .dumpCacheContent() as DumpInfo<CacheKey, CloseableImage>

      responder.success(
        StatoObject.Builder()
          .put(
            "levels",
            StatoArray.Builder()
              .put(
                StatoObject.Builder()
                  .put("cacheType", "On screen bitmaps")
                  .put("sizeBytes", memoryCache.size - memoryCache.lruSize)
                  .put("imageIds", buildImageIdList(memoryCache.sharedEntries))
                  .build())
              .put(
                StatoObject.Builder()
                  .put("cacheType", "Bitmap memory cache")
                  .put("clearKey", "memory")
                  .put("sizeBytes", memoryCache.size)
                  .put("maxSizeBytes", memoryCache.maxSize)
                  .put("imageIds", buildImageIdList(memoryCache.lruEntries))
                  .build())
              // TODO (t31947642): list images on disk
              .build())
          .build())
      perfLogger.endMarker("Sonar.Fresco.listImages")
    }


    connection.receive(
      "getImage") { params: StatoObject, responder: StatoResponder ->
      if (!ensureFrescoInitialized(responder)) {
        return@receive
      }

      perfLogger.startMarker("Sonar.Fresco.getImage")
      val imageId = params.getString("imageId")
      val cacheKey = statoImageTracker.getCacheKey(imageId)
      if (cacheKey == null) {
        respondError(responder, "ImageId $imageId was evicted from cache")
        perfLogger.cancelMarker("Sonar.Fresco.getImage")
        return@receive
      }
      val imagePipelineFactory = Fresco.getImagePipelineFactory()
      val ref = imagePipelineFactory.bitmapCountingMemoryCache.get(cacheKey)
      if (ref == null) {
        respondError(responder, "no bitmap withId=$imageId")
        perfLogger.cancelMarker("Sonar.Fresco.getImage")
        return@receive
      }
      val bitmap = ref!!.get() as CloseableBitmap
      val encodedBitmap = bitmapToBase64Preview(bitmap.underlyingBitmap, platformBitmapFactory)

      responder.success(
        StatoObject.Builder()
          .put("imageId", imageId)
          .put("uri", statoImageTracker.getUriString(cacheKey))
          .put("width", bitmap.width)
          .put("height", bitmap.height)
          .put("sizeBytes", bitmap.sizeInBytes)
          .put("data", encodedBitmap)
          .build())

      perfLogger.endMarker("Sonar.Fresco.getImage")
    }


    connection.receive(
      "clear") { params: StatoObject, responder: StatoResponder ->
      if (!ensureFrescoInitialized(responder)) {
        return@receive
      }

      perfLogger.startMarker("Sonar.Fresco.clear")
      when (params.getString("type")) {
        "memory" -> {
          val imagePipelineFactory = Fresco.getImagePipelineFactory()
          imagePipelineFactory.bitmapMemoryCache.removeAll(ALWAYS_TRUE_PREDICATE)
        }
        "disk" -> Fresco.getImagePipeline().clearDiskCaches()
      }
      perfLogger.endMarker("Sonar.Fresco.clear")
    }


    connection.receive(
      "trimMemory") { params: StatoObject, responder: StatoResponder ->
      if (!ensureFrescoInitialized(responder)) {
        return@receive
      }

      mMemoryManager?.trimMemory(
        ON_SYSTEM_LOW_MEMORY_WHILE_APP_IN_FOREGROUND)
    }


    connection.receive(
      "enableDebugOverlay") { params: StatoObject, responder: StatoResponder ->
      if (!ensureFrescoInitialized(responder)) {
        return@receive
      }

      val enabled = params.getBoolean("enabled")
      if (debugPrefHelper != null) {
        debugPrefHelper.isDebugOverlayEnabled = enabled
      }
    }

    val debugPrefHelper = debugPrefHelper ?: return
    debugPrefHelper.run {
      setDebugOverlayEnabledListener(
        object : FrescoStatoDebugPrefHelper.Listener {
          override fun onEnabledStatusChanged(enabled: Boolean) {
            sendDebugOverlayEnabledEvent(enabled)
          }
        })

      sendDebugOverlayEnabledEvent(debugPrefHelper.isDebugOverlayEnabled)
    }
  }

  private fun ensureFrescoInitialized(responder: StatoResponder): Boolean {
    perfLogger.startMarker("Sonar.Fresco.ensureFrescoInitialized")
    try {
      Fresco.getImagePipelineFactory()
      return true
    } catch (e: NullPointerException) {
      respondError(responder, "Fresco is not initialized yet")
      return false
    } finally {
      perfLogger.endMarker("Sonar.Fresco.ensureFrescoInitialized")
    }
  }

  private fun buildImageIdList(images: List<DumpInfoEntry<CacheKey, CloseableImage>>): StatoArray {

    val builder = StatoArray.Builder()
    for (entry in images) {
      val imageDebugData = statoImageTracker.getImageDebugData(entry.key)

      if (imageDebugData == null) {
        builder.put(statoImageTracker.trackImage(entry.key).uniqueId)
      } else {
        builder.put(imageDebugData!!.uniqueId)
      }
    }
    return builder.build()
  }

  private fun bitmapToBase64Preview(bitmap: Bitmap, bitmapFactory: PlatformBitmapFactory): String {
    if (bitmap.width < BITMAP_SCALING_THRESHOLD_WIDTH && bitmap.height < BITMAP_SCALING_THRESHOLD_HEIGHT) {
      return bitmapToBase64WithoutScaling(bitmap)
    }
    perfLogger.startMarker("Sonar.Fresco.bitmap2base64-resize")

    // TODO (t19034797): properly load images
    var scaledBitmapReference: CloseableReference<Bitmap>? = null
    try {
      val previewAspectRatio = (BITMAP_PREVIEW_WIDTH / BITMAP_PREVIEW_HEIGHT).toFloat()
      val imageAspectRatio = bitmap.width / bitmap.height

      val scaledWidth: Int
      val scaledHeight: Int
      if (previewAspectRatio > imageAspectRatio) {
        scaledWidth = bitmap.width * BITMAP_PREVIEW_HEIGHT / bitmap.height
        scaledHeight = BITMAP_PREVIEW_HEIGHT
      } else {
        scaledWidth = BITMAP_PREVIEW_WIDTH
        scaledHeight = bitmap.height * BITMAP_PREVIEW_WIDTH / bitmap.width
      }
      scaledBitmapReference = bitmapFactory.createScaledBitmap(bitmap, scaledWidth, scaledHeight, false)
      return bitmapToBase64WithoutScaling(scaledBitmapReference!!.get())
    } finally {
      CloseableReference.closeSafely(scaledBitmapReference)
      perfLogger.endMarker("Sonar.Fresco.bitmap2base64-resize")
    }
  }

  private fun bitmapToBase64WithoutScaling(bitmap: Bitmap): String {
    perfLogger.startMarker("Sonar.Fresco.bitmap2base64-orig")
    var byteArrayOutputStream: ByteArrayOutputStream? = null
    try {
      byteArrayOutputStream = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)

      return "data:image/png;base64," + Base64.encodeToString(byteArrayOutputStream!!.toByteArray(), Base64.DEFAULT)
    } finally {
      if (byteArrayOutputStream != null) {
        try {
          byteArrayOutputStream!!.close()
        } catch (e: IOException) {
          // ignore
        }

      }
      perfLogger.endMarker("Sonar.Fresco.bitmap2base64-orig")
    }
  }

  override fun onImageLoadStatusUpdated(
    imagePerfData: ImagePerfData, @ImageLoadStatus imageLoadStatus: Int) {
    if (imageLoadStatus != ImageLoadStatus.SUCCESS) {
      return
    }

    val requestId = imagePerfData.requestId ?: return

    val data = statoImageTracker.getDebugDataForRequestId(requestId) ?: return

    val imageIdsBuilder = StatoArray.Builder()
    val cks = data.cacheKeys
    if (cks != null) {
      for (ck in cks) {
        val d = statoImageTracker.getImageDebugData(ck)
        if (d != null) {
          imageIdsBuilder.put(d.uniqueId)
        }
      }
    } else {
      imageIdsBuilder.put(data.uniqueId)
    }

    val attribution: StatoArray
    val callerContext = imagePerfData.callerContext
    if (callerContext == null) {
      attribution = StatoArray.Builder().put("unknown").build()
    } else if (mSonarObjectHelper == null) {
      attribution = StatoArray.Builder().put(callerContext.toString()).build()
    } else {
      attribution = mSonarObjectHelper.fromCallerContext(callerContext)
    }

    val response = StatoObject.Builder()
      .put("imageIds", imageIdsBuilder.build())
      .put("attribution", attribution)
      .put("startTime", imagePerfData.controllerSubmitTimeMs)
      .put("endTime", imagePerfData.controllerFinalImageSetTimeMs)
      .put("source", ImageOriginUtils.toString(imagePerfData.imageOrigin))

    if (!imagePerfData.isPrefetch) {
      response.put(
        "viewport",
        StatoObject.Builder()
          // TODO (t31947746): scan times
          .put("width", imagePerfData.onScreenWidthPx)
          .put("height", imagePerfData.onScreenHeightPx)
          .build())
    }

    send(FRESCO_EVENT, response.build())
  }

  override fun onImageVisibilityUpdated(imagePerfData: ImagePerfData, visibilityState: Int) {
    // ignored
  }

  fun sendDebugOverlayEnabledEvent(enabled: Boolean) {
    val builder = StatoObject.Builder().put("enabled", enabled)
    send(FRESCO_DEBUGOVERLAY_EVENT, builder.build())
  }

  companion object {

    private val FRESCO_EVENT = "events"
    private val FRESCO_DEBUGOVERLAY_EVENT = "debug_overlay_event"

    private val BITMAP_PREVIEW_WIDTH = 150
    private val BITMAP_PREVIEW_HEIGHT = 150
    private val BITMAP_SCALING_THRESHOLD_WIDTH = 200
    private val BITMAP_SCALING_THRESHOLD_HEIGHT = 200

    /** Helper for clearing cache.  */
    private val ALWAYS_TRUE_PREDICATE = Predicate<CacheKey> { true }

    private fun respondError(responder: StatoResponder, errorReason: String) {
      responder.error(StatoObject.Builder().put("reason", errorReason).build())
    }
  }
}

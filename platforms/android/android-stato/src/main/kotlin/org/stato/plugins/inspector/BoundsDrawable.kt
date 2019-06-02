/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.Region
import android.graphics.drawable.Drawable
import android.text.TextPaint
import android.util.Log
import android.view.View
import org.densebrain.android.logging.DroidLogger
import org.densebrain.android.logging.info
import java.util.WeakHashMap

class BoundsDrawable(private val density: Float) : Drawable(), DroidLogger {

  private val textPaint: TextPaint = TextPaint()
  private val marginPaint: Paint
  private val paddingPaint: Paint
  private val contentPaint: Paint
  private val workRect: Rect = Rect()
  private val marginBounds: Rect = Rect()
  private val paddingBounds: Rect = Rect()
  private val contentBounds: Rect = Rect()

  private val strokeWidth: Int
  private val ascentOffset: Float

  override fun getOpacity(): Int {
    return PixelFormat.TRANSLUCENT
  }

  init {

    textPaint.isAntiAlias = true
    textPaint.textAlign = Paint.Align.CENTER
    textPaint.textSize = dpToPx(8f).toFloat()
    ascentOffset = -textPaint.ascent() / 2f
    strokeWidth = dpToPx(2f)

    paddingPaint = Paint()
    paddingPaint.style = Paint.Style.FILL
    paddingPaint.color = COLOR_HIGHLIGHT_PADDING

    contentPaint = Paint()
    contentPaint.style = Paint.Style.FILL
    contentPaint.color = COLOR_HIGHLIGHT_CONTENT

    marginPaint = Paint()
    marginPaint.style = Paint.Style.FILL
    marginPaint.color = COLOR_HIGHLIGHT_MARGIN
  }

  fun setBounds(marginBounds: Rect, paddingBounds: Rect, contentBounds: Rect) {

    this.marginBounds.set(marginBounds)
    this.paddingBounds.set(paddingBounds)
    this.contentBounds.set(contentBounds)
    bounds = marginBounds
  }

  override fun draw(canvas: Canvas) {
    info("Drawing")
    canvas.drawRect(contentBounds, contentPaint)

    var saveCount = canvas.save()
    canvas.clipRect(contentBounds, Region.Op.DIFFERENCE)
    canvas.drawRect(paddingBounds, paddingPaint)
    canvas.restoreToCount(saveCount)

    saveCount = canvas.save()
    canvas.clipRect(paddingBounds, Region.Op.DIFFERENCE)
    canvas.drawRect(marginBounds, marginPaint)
    canvas.restoreToCount(saveCount)

    drawBoundsDimensions(canvas, contentBounds)


    // Disabled for now since Stato doesn't support options too well at this point in time.
    // Once options are supported, we should re-enable the calls below
    // drawCardinalDimensionsBetween(canvas, contentBounds, paddingBounds);
    // drawCardinalDimensionsBetween(canvas, paddingBounds, marginBounds);
  }

  override fun setAlpha(alpha: Int) {
    // No-op
  }

  override fun setColorFilter(colorFilter: ColorFilter) {
    // No-op
  }

  private fun drawCardinalDimensionsBetween(canvas: Canvas, inner: Rect, outer: Rect) {
    workRect.set(inner)
    workRect.left = outer.left
    workRect.right = inner.left
    drawBoundsDimension(canvas, workRect, workRect.width())
    workRect.left = inner.right
    workRect.right = outer.right
    drawBoundsDimension(canvas, workRect, workRect.width())
    workRect.set(outer)
    workRect.bottom = inner.top
    drawBoundsDimension(canvas, workRect, workRect.height())
    workRect.bottom = outer.bottom
    workRect.top = inner.bottom
    drawBoundsDimension(canvas, workRect, workRect.height())
  }

  private fun drawBoundsDimension(canvas: Canvas, bounds: Rect, value: Int) {
    if (value <= 0) {
      return
    }
    val saveCount = canvas.save()
    canvas.translate(bounds.centerX().toFloat(), bounds.centerY().toFloat())
    drawOutlinedText(canvas, value.toString() + "px")
    canvas.restoreToCount(saveCount)
  }

  private fun drawBoundsDimensions(canvas: Canvas, bounds: Rect) {
    val saveCount = canvas.save()
    canvas.translate(bounds.centerX().toFloat(), bounds.centerY().toFloat())
    drawOutlinedText(canvas, "${bounds.width()}px  \u00D7  ${bounds.height()}px")
    canvas.restoreToCount(saveCount)
  }

  private fun drawOutlinedText(canvas: Canvas, text: String) {
    textPaint.color = Color.BLACK
    textPaint.strokeWidth = strokeWidth.toFloat()
    textPaint.style = Paint.Style.STROKE
    canvas.drawText(text, 0f, ascentOffset, textPaint)

    textPaint.color = Color.WHITE
    textPaint.strokeWidth = 0f
    textPaint.style = Paint.Style.FILL
    canvas.drawText(text, 0f, ascentOffset, textPaint)
  }

  private fun dpToPx(dp: Number): Int {
    return (dp.toFloat() * density).toInt()
  }

  companion object : DroidLogger {
    const val COLOR_HIGHLIGHT_CONTENT = -0x77778a3b
    const val COLOR_HIGHLIGHT_PADDING = -0x77622e7b
    const val COLOR_HIGHLIGHT_MARGIN = -0x77084885


    private val instanceMap = WeakHashMap<View, BoundsDrawable>()


    fun getInstance(
      view: View,
      density: Float,
      marginBounds: Rect,
      paddingBounds: Rect,
      contentBounds: Rect
    ): BoundsDrawable {
      val drawable = getInstance(view, density)
      drawable.setBounds(marginBounds, paddingBounds, contentBounds)
      info("Setting Bounds for ${contentBounds} ${paddingBounds} ${marginBounds}")
      return drawable
    }


    fun getInstance(view: View, density: Float): BoundsDrawable {
      return instanceMap.getOrPut(view) {
        Log.i("BoundsDrawable","Creating Bounds for ${view.id}")
        BoundsDrawable(density)
      }
    }
  }
}

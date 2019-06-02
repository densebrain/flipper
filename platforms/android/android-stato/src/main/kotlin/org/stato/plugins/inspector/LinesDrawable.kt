/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.util.Log
import android.view.View
import java.util.WeakHashMap

class LinesDrawable(private val density: Float) : Drawable() {

  private val workRect: Rect = Rect()
  private val marginBounds: Rect = Rect()
  private val paddingBounds: Rect = Rect()
  private val contentBounds: Rect = Rect()

  override fun getOpacity(): Int {
    return PixelFormat.TRANSLUCENT
  }

  fun setBounds(marginBounds: Rect, paddingBounds: Rect, contentBounds: Rect) {
    this.marginBounds.set(marginBounds)
    this.paddingBounds.set(paddingBounds)
    this.contentBounds.set(contentBounds)
    bounds = marginBounds
  }

  override fun draw(canvas: Canvas) {
    Log.i("LineDrawable", "draw: ${contentBounds}")
    val dashPaint = Paint()
    dashPaint.color = -0x800000
    dashPaint.style = Paint.Style.STROKE
    dashPaint.strokeWidth = 3f
    dashPaint.pathEffect = DashPathEffect(floatArrayOf(10f, 10f), 0f)

    canvas.drawLine(contentBounds.right.toFloat(), 0f, contentBounds.right.toFloat(), 100000f, dashPaint)
    canvas.drawLine(contentBounds.left.toFloat(), 0f, contentBounds.left.toFloat(), 100000f, dashPaint)
    canvas.drawLine(0f, contentBounds.top.toFloat(), 100000f, contentBounds.top.toFloat(), dashPaint)
    canvas.drawLine(0f, contentBounds.bottom.toFloat(), 100000f, contentBounds.bottom.toFloat(), dashPaint)
  }

  override fun setAlpha(alpha: Int) {
    // No-op
  }

  override fun setColorFilter(colorFilter: ColorFilter) {
    // No-op
  }

  companion object {

    @JvmStatic
    private val instanceMap = WeakHashMap<View, LinesDrawable>()

    @JvmStatic
    fun getInstance(
      view: View, density: Float, marginBounds: Rect, paddingBounds: Rect, contentBounds: Rect): LinesDrawable {
      val drawable = getInstance(view, density)
      drawable.setBounds(marginBounds, paddingBounds, contentBounds)
      return drawable
    }

    @JvmStatic
    fun getInstance(view: View, density: Float): LinesDrawable {
      return instanceMap.getOrPut(view) {
        LinesDrawable(density)
      }

    }
  }
}

/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.sample

import android.content.Intent
import com.facebook.drawee.backends.pipeline.Fresco
import org.stato.android.diagnostics.StatoDiagnosticActivity
import com.facebook.litho.ClickEvent
import com.facebook.litho.Column
import com.facebook.litho.Component
import com.facebook.litho.ComponentContext
import com.facebook.litho.StateValue
import com.facebook.litho.annotations.LayoutSpec
import com.facebook.litho.annotations.OnCreateLayout
import com.facebook.litho.annotations.OnEvent
import com.facebook.litho.annotations.OnUpdateState
import com.facebook.litho.annotations.State
import com.facebook.litho.fresco.FrescoImage
import com.facebook.litho.widget.Text

@LayoutSpec
object RootComponentSpec {

  @OnCreateLayout
  fun onCreateLayout(c: ComponentContext, @State displayImage: Boolean): Component {
    val controller = Fresco.newDraweeControllerBuilder()
      .setUri("https://fbflipper.com/img/icon.png")
      .build()

    return Column.create(c)
      .child(
        Text.create(c)
          .text("Tap to hit get request")
          .key("1")
          .textSizeSp(20f)
          .clickHandler(RootComponent.hitGetRequest(c)))
      .child(
        Text.create(c)
          .text("Tap to hit post request")
          .key("2")
          .textSizeSp(20f)
          .clickHandler(RootComponent.hitPostRequest(c)))
      .child(
        Text.create(c)
          .text("Trigger Notification")
          .key("3")
          .textSizeSp(20f)
          .clickHandler(RootComponent.triggerNotification(c)))
      .child(
        Text.create(c)
          .text("Diagnose connection issues")
          .key("4")
          .textSizeSp(20f)
          .clickHandler(RootComponent.openDiagnostics(c)))
      .child(
        Text.create(c)
          .text("Load Fresco image")
          .key("5")
          .textSizeSp(20f)
          .clickHandler(RootComponent.loadImage(c)))
      .child(if (displayImage) FrescoImage.create(c).controller(controller) else null)
      .build()
  }

  @OnEvent(ClickEvent::class)
  fun hitGetRequest(_c: ComponentContext) {
    ExampleActions.sendGetRequest()
  }

  @OnEvent(ClickEvent::class)
  fun hitPostRequest(_c: ComponentContext) {
    ExampleActions.sendPostRequest()
  }

  @OnEvent(ClickEvent::class)
  fun triggerNotification(_c: ComponentContext) {
    ExampleActions.sendNotification()
  }

  @OnEvent(ClickEvent::class)
  fun openDiagnostics(c: ComponentContext) {
    val intent = Intent(c.androidContext, StatoDiagnosticActivity::class.java)
    c.androidContext.startActivity(intent)
  }

  @OnUpdateState
  fun updateDisplayImage(displayImage: StateValue<Boolean>) {
    displayImage.set(true)
  }

  @OnEvent(ClickEvent::class)
  fun loadImage(c: ComponentContext) {
    RootComponent.updateDisplayImageAsync(c)
  }
}

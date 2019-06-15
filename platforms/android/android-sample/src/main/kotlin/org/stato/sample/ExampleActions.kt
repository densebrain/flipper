package org.stato.sample

import android.util.Log
import okhttp3.*
import org.stato.android.AndroidStatoClientManager
import org.stato.plugins.example.ExampleStatoPlugin
import java.io.IOException

object ExampleActions {

  fun sendPostRequest() {
    val formBody = FormBody.Builder().add("app", "Stato").add("remarks", "Its awesome").build()

    val request = Request.Builder()
      .url("https://demo9512366.mockable.io/SonarPost")
      .post(formBody)
      .build()


    NetworkManager.httpClient
      .newCall(request)
      .enqueue(
        object : Callback {
          override fun onFailure(call: Call, e: IOException) {
            e.printStackTrace()
            Log.d("Stato", e.message)
          }

          @Throws(IOException::class)
          override fun onResponse(call: Call, response: Response) {
            if (response.isSuccessful) {
              val body = response.body() ?: throw IllegalStateException("Body is null")
              Log.d("Stato", body.string())
            } else {
              Log.d("Stato", "not successful")
            }
          }
        })
  }

  fun sendGetRequest() {
    val request = Request.Builder().url("https://api.github.com/repos/facebook/yoga").get().build()


    NetworkManager.httpClient
      .newCall(request)
      .enqueue(
        object : Callback {
          override fun onFailure(call: Call, e: IOException) {
            e.printStackTrace()
            Log.d("Stato", e.message)
          }

          @Throws(IOException::class)
          override fun onResponse(call: Call, response: Response) {
            if (response.isSuccessful) {
              Log.d("Stato", response.body()!!.string())
            } else {
              Log.d("Stato", "not successful")
            }
          }
        })
  }

  fun sendNotification() {
    AndroidStatoClientManager.client?.let { client ->

      val plugin = client.getPluginByClass(ExampleStatoPlugin::class.java)
      plugin!!.triggerNotification()
    }
  }
}

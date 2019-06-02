package org.stato.sample

import android.util.Log

import org.stato.core.StatoClient
import org.stato.plugins.example.ExampleStatoPlugin
import java.io.IOException
import okhttp3.Call
import okhttp3.Callback
import okhttp3.FormBody
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.ResponseBody
import org.stato.android.AndroidStatoClientManager

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

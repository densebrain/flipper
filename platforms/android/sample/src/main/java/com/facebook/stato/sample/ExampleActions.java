package com.facebook.stato.sample;

import android.util.Log;
import com.facebook.stato.android.AndroidStatoClient;
import com.facebook.stato.core.StatoClient;
import com.facebook.stato.plugins.example.ExampleStatoPlugin;
import java.io.IOException;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.FormBody;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

public final class ExampleActions {

  public static void sendPostRequest() {
    final RequestBody formBody =
        new FormBody.Builder().add("app", "Stato").add("remarks", "Its awesome").build();

    final Request request =
        new Request.Builder()
            .url("https://demo9512366.mockable.io/SonarPost")
            .post(formBody)
            .build();

    //noinspection NullableProblems
    StatoSampleApplication.getHttpClient()
        .newCall(request)
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(final Call call, final IOException e) {
                e.printStackTrace();
                Log.d("Stato", e.getMessage());
              }

              @Override
              public void onResponse(final Call call, final Response response) throws IOException {
                if (response.isSuccessful()) {
                  ResponseBody body = response.body();
                  if (body == null) throw new IllegalStateException("Body is null");
                  Log.d("Stato", body.string());
                } else {
                  Log.d("Stato", "not successful");
                }
              }
            });
  }

  public static void sendGetRequest() {
    final Request request =
        new Request.Builder().url("https://api.github.com/repos/facebook/yoga").get().build();

    //noinspection NullableProblems
    StatoSampleApplication.getHttpClient()
        .newCall(request)
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(final Call call, final IOException e) {
                e.printStackTrace();
                Log.d("Stato", e.getMessage());
              }

              @Override
              public void onResponse(final Call call, final Response response) throws IOException {
                if (response.isSuccessful()) {
                  Log.d("Stato", response.body().string());
                } else {
                  Log.d("Stato", "not successful");
                }
              }
            });
  }

  public static void sendNotification() {
    final StatoClient client = AndroidStatoClient.getInstanceIfInitialized();
    if (client != null) {
      final ExampleStatoPlugin plugin = client.getPluginByClass(ExampleStatoPlugin.class);
      plugin.triggerNotification();
    }
  }
}

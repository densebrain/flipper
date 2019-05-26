package com.facebook.states.sample;

import android.util.Log;
import com.facebook.states.android.AndroidStatesClient;
import com.facebook.states.core.StatesClient;
import com.facebook.states.plugins.example.ExampleStatesPlugin;
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
        new FormBody.Builder().add("app", "States").add("remarks", "Its awesome").build();

    final Request request =
        new Request.Builder()
            .url("https://demo9512366.mockable.io/SonarPost")
            .post(formBody)
            .build();

    //noinspection NullableProblems
    StatesSampleApplication.getHttpClient()
        .newCall(request)
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(final Call call, final IOException e) {
                e.printStackTrace();
                Log.d("States", e.getMessage());
              }

              @Override
              public void onResponse(final Call call, final Response response) throws IOException {
                if (response.isSuccessful()) {
                  ResponseBody body = response.body();
                  if (body == null) throw new IllegalStateException("Body is null");
                  Log.d("States", body.string());
                } else {
                  Log.d("States", "not successful");
                }
              }
            });
  }

  public static void sendGetRequest() {
    final Request request =
        new Request.Builder().url("https://api.github.com/repos/facebook/yoga").get().build();

    //noinspection NullableProblems
    StatesSampleApplication.getHttpClient()
        .newCall(request)
        .enqueue(
            new Callback() {
              @Override
              public void onFailure(final Call call, final IOException e) {
                e.printStackTrace();
                Log.d("States", e.getMessage());
              }

              @Override
              public void onResponse(final Call call, final Response response) throws IOException {
                if (response.isSuccessful()) {
                  Log.d("States", response.body().string());
                } else {
                  Log.d("States", "not successful");
                }
              }
            });
  }

  public static void sendNotification() {
    final StatesClient client = AndroidStatesClient.getInstanceIfInitialized();
    if (client != null) {
      final ExampleStatesPlugin plugin = client.getPluginByClass(ExampleStatesPlugin.class);
      plugin.triggerNotification();
    }
  }
}

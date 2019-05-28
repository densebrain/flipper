/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.stato.plugins.network;

import android.util.Base64;
import com.facebook.stato.core.ErrorReportingRunnable;
import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.plugins.common.BufferingStatoPlugin;
import java.util.List;

public class NetworkStatoPlugin extends BufferingStatoPlugin implements NetworkReporter {
  public static final String ID = "@stato/plugin-network";

  private final List<NetworkResponseFormatter> mFormatters;

  public NetworkStatoPlugin() {
    this(null);
  }

  public NetworkStatoPlugin(List<NetworkResponseFormatter> formatters) {
    this.mFormatters = formatters;
  }

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public void reportRequest(RequestInfo requestInfo) {
    final StatoObject request =
        new StatoObject.Builder()
            .put("id", requestInfo.requestId)
            .put("timestamp", requestInfo.timeStamp)
            .put("method", requestInfo.method)
            .put("url", requestInfo.uri)
            .put("headers", toStatoObject(requestInfo.headers))
            .put("data", toBase64(requestInfo.body))
            .build();

    send("newRequest", request);
  }

  @Override
  public void reportResponse(final ResponseInfo responseInfo) {
    final Runnable job =
        new ErrorReportingRunnable(getConnection()) {
          @Override
          protected void runOrThrow() throws Exception {
            if (shouldStripResponseBody(responseInfo)) {
              responseInfo.body = null;
            }

            final StatoObject response =
                new StatoObject.Builder()
                    .put("id", responseInfo.requestId)
                    .put("timestamp", responseInfo.timeStamp)
                    .put("status", responseInfo.statusCode)
                    .put("reason", responseInfo.statusReason)
                    .put("headers", toStatoObject(responseInfo.headers))
                    .put("data", toBase64(responseInfo.body))
                    .build();

            send("newResponse", response);
          }
        };

    if (mFormatters != null) {
      for (NetworkResponseFormatter formatter : mFormatters) {
        if (formatter.shouldFormat(responseInfo)) {
          formatter.format(
              responseInfo,
              new NetworkResponseFormatter.OnCompletionListener() {
                @Override
                public void onCompletion(final String json) {
                  responseInfo.body = json.getBytes();
                  job.run();
                }
              });
          return;
        }
      }
    }

    job.run();
  }

  private String toBase64(byte[] bytes) {
    if (bytes == null) {
      return null;
    }
    return new String(Base64.encode(bytes, Base64.DEFAULT));
  }

  private StatoArray toStatoObject(List<Header> headers) {
    final StatoArray.Builder list = new StatoArray.Builder();

    for (Header header : headers) {
      list.put(new StatoObject.Builder().put("key", header.name).put("value", header.value));
    }

    return list.build();
  }

  private static boolean shouldStripResponseBody(ResponseInfo responseInfo) {
    final Header contentType = responseInfo.getFirstHeader("content-type");
    if (contentType == null) {
      return false;
    }

    return contentType.value.contains("image/")
        || contentType.value.contains("video/")
        || contentType.value.contains("application/zip");
  }
}

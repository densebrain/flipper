/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <memory>


#include <folly/dynamic.h>
#include <folly/json.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventBaseManager.h>

#include <stato/StatoClient.h>
#include <stato/StatoClientManager.h>
#include <stato/StatoPluginConnection.h>
#include <stato/StatoResponder.h>
#include <stato/StatoStateUpdateListener.h>
#include <stato/StatoState.h>
#include <stato/StatoRequestResponse.h>
#include <stato/utils/Messaging.h>
#include <fbjni/fbjni.h>

#include <stato-models/Payload.pb.h>

//#ifdef STATO_OSS
//
//#else
//#include <fb/fbjni.h>
//#endif

using namespace stato;
using namespace facebook;

namespace {

  std::shared_ptr<StatoClient> getClient() {
    auto manager = StatoClientManager::get();
    return manager->getClient();
  }

  void handleException(const std::exception &e) {
    // TODO: T35898390, report and log the exception in scribe
    // TODO: T35898500, send stato notification
    std::string message = "Exception caught in C++ and suppressed: ";
    message += e.what();
    __android_log_write(ANDROID_LOG_ERROR, "STATO", message.c_str());
  }

  class JStatoEventBase : public jni::HybridClass<JStatoEventBase> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoEventBase;";

    static void registerNatives() {
      registerHybrid({
        makeNativeMethod("initHybrid", JStatoEventBase::initHybrid),
        makeNativeMethod("loopForever", JStatoEventBase::loopForever),
      });
    }

    folly::EventBase *eventBase() {
      return &eventBase_;
    }

  private:
    friend HybridBase;

    JStatoEventBase() {}

    void loopForever() {
      folly::EventBaseManager::get()->setEventBase(&eventBase_, false);
      eventBase_.loopForever();
    }

    static void initHybrid(jni::alias_ref<jhybridobject> o) {
      return setCxxInstance(o);
    }

    folly::EventBase eventBase_;
  };

  class JStatoObject : public jni::JavaClass<JStatoObject> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoObject;";

    static jni::local_ref<JStatoObject> create(const folly::dynamic &json) {
      return newInstance(folly::toJson(json));
    }

    std::string toJsonString() {
      static const auto method = javaClassStatic()->getMethod<std::string()>("toJsonString");
      return method(self())->toStdString();
    }
  };

  class JStatoArray : public jni::JavaClass<JStatoArray> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoArray;";

    static jni::local_ref<JStatoArray> create(const folly::dynamic &json) {
      return newInstance(folly::toJson(json));
    }

    std::string toJsonString() {
      static const auto method = javaClassStatic()->getMethod<std::string()>("toJsonString");
      return method(self())->toStdString();
    }
  };

  class JStatoResponder : public jni::JavaClass<JStatoResponder> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoResponder;";
  };

  class JStatoResponderImpl : public jni::HybridClass<JStatoResponderImpl, JStatoResponder> {
  public:

    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoResponderImpl;";

    static void registerNatives() {
      registerHybrid({
        makeNativeMethod("successObject", JStatoResponderImpl::successObject),
        makeNativeMethod("successArray", JStatoResponderImpl::successArray),
        makeNativeMethod("error", JStatoResponderImpl::error),
      });
    }

    void respond(const folly::dynamic &payload) {
      EnvelopePayload envelopePayload;
      //PluginCallRequestResponse requestResponse;
      requestResponse->set_body(folly::toJson(payload));
      envelopePayload.set_body(messageToJson(*requestResponse));
      envelopePayload.set_type(PayloadTypePluginCall);

      responder->success(envelopePayload);
    };

    void successObject(jni::alias_ref<JStatoObject> json) {
      folly::dynamic payload = (!json) ?
                               folly::dynamic::object() :
                               folly::parseJson(json->toJsonString());

      respond(payload);
    };

    void successArray(jni::alias_ref<JStatoArray> json) {
      auto payload = json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object();
      respond(payload);

    }

    void error(jni::alias_ref<JStatoObject> json) {
      auto o = json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object();

      ErrorRequestResponse error;
      error.set_message(o.getDefault("message", "").asString());
      error.set_name(o.getDefault("name", "").asString());
      error.set_stacktrace(o.getDefault("stacktrace", "").asString());
      responder->error(error);
    }

  private:
    friend HybridBase;
    std::shared_ptr<PluginCallRequestResponse> requestResponse;
    std::shared_ptr<StatoResponder> responder;

    JStatoResponderImpl(
      std::shared_ptr<PluginCallRequestResponse> requestResponse,
      std::shared_ptr<StatoResponder> responder
    ) :
      requestResponse(std::move(requestResponse)),
      responder(std::move(responder)) {}
  };

  class JStatoReceiver : public jni::JavaClass<JStatoReceiver> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoReceiver;";

    void receive(
      const std::string &pluginId,
      const std::string &apiMethod,
      const folly::dynamic params,
      //std::shared_ptr<StatoRequestResponse> requestResponse,
      const PluginCallRequestResponse &requestResponse,
      std::shared_ptr<EnvelopePayload> envelopePayload,
      std::shared_ptr<Envelope> envelope,
      std::shared_ptr<StatoResponder> responder
    ) const {
      static const auto method = javaClassStatic()->getMethod<
        void(
          jni::alias_ref<JStatoObject::javaobject>,
          jni::alias_ref<JStatoResponder::javaobject>
        )
      >("onReceive");

      auto newRequestResponse = std::make_shared<PluginCallRequestResponse>();
      newRequestResponse->CopyFrom(requestResponse);
      newRequestResponse->set_plugin_id(pluginId);

      method(self(), JStatoObject::create(std::move(params)),
        JStatoResponderImpl::newObjectCxxArgs(newRequestResponse, responder));
    }


  };

  class JStatoPluginConnection : public jni::JavaClass<JStatoPluginConnection> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoPluginConnection;";
  };

  class JStatoPluginConnectionImpl
    : public jni::HybridClass<JStatoPluginConnectionImpl, JStatoPluginConnection> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoPluginConnectionImpl;";

    static void registerNatives() {
      registerHybrid({
        makeNativeMethod("sendObject", JStatoPluginConnectionImpl::sendObject),
        makeNativeMethod("sendArray", JStatoPluginConnectionImpl::sendArray),
        makeNativeMethod("reportError", JStatoPluginConnectionImpl::reportError),
        makeNativeMethod("receive", JStatoPluginConnectionImpl::receive),
      });
    }

    void sendObject(const std::string method, jni::alias_ref<JStatoObject> json) {
      _connection->send(std::move(method), json ? json->toJsonString() : "{}");
      //json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object());
    }

    void sendArray(const std::string method, jni::alias_ref<JStatoArray> json) {
      _connection->send(std::move(method), json ? json->toJsonString() : "{}");
      //json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object());
    }

    void reportError(jni::alias_ref<jni::JThrowable> throwable) {
      _connection->error(throwable->toString(), throwable->getStackTrace()->toString());
    }

    void receive(const std::string method, jni::alias_ref<JStatoReceiver> receiver) {
      auto global = make_global(receiver);

      _connection->receive(std::move(method), [this, global](
        const std::string & pluginId,
        const std::string &apiMethod,
        std::shared_ptr<EnvelopePayload> envelopePayload,
        std::shared_ptr<Envelope> envelope,
        std::shared_ptr<StatoResponder> responder
      ) {
        PluginCallRequestResponse requestResponse;
        JsonStringToMessage(envelopePayload->body(), &requestResponse);
        //envelopePayload->body().UnpackTo(&requestResponse);

//        envelopePayload->
        global->receive(
          pluginId,
          apiMethod,
          folly::parseJson(requestResponse.body()),
          requestResponse,
          envelopePayload,
          envelope,
          responder
        );
      });
    };


  private:
    friend HybridBase;
    std::shared_ptr<StatoPluginConnection> _connection;

    JStatoPluginConnectionImpl(std::shared_ptr<StatoPluginConnection> connection) :
      _connection(std::move(connection)) {}
  };

  class JStatoPlugin : public jni::JavaClass<JStatoPlugin> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoPlugin;";

    std::string identifier() const {
      static const auto method = javaClassStatic()->getMethod<std::string()>("getId");
      try {
        return method(self())->toStdString();

      } catch (const std::exception &e) {
        handleException(e);
        return "";
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
        return "";
      }
    }

    void didConnect(std::shared_ptr<StatoPluginConnection> conn) {
      auto method =
        javaClassStatic()
          ->getMethod<void(jni::alias_ref<JStatoPluginConnection::javaobject>)>(
            "onConnect");
      try {

        method(self(), JStatoPluginConnectionImpl::newObjectCxxArgs(conn));

      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void didDisconnect() {
      static const auto method = javaClassStatic()->getMethod<void()>("onDisconnect");
      try {
        method(self());
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    bool runInBackground() {
      static const auto method =
        javaClassStatic()->getMethod<jboolean()>("runInBackground");
      try {
        return method(self()) == JNI_TRUE;
      } catch (const std::exception &e) {
        handleException(e);
        return false;
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
        return false;
      }
    }
  };

  class JStatoStateUpdateListener : public jni::JavaClass<JStatoStateUpdateListener> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoStateUpdateListener;";

    void onUpdate() {
      try {
        static const auto method =
          javaClassStatic()->getMethod<void()>("onUpdate");
        method(self());
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void onStepStarted(std::string step) {
      try {
        static const auto method =
          javaClassStatic()->getMethod<void(std::string)>("onStepStarted");
        method(self(), step);
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void onStepSuccess(std::string step) {
      try {
        static const auto method =
          javaClassStatic()->getMethod<void(std::string)>("onStepSuccess");
        method(self(), step);
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void onStepFailed(std::string step, std::string errorMessage) {
      try {
        static const auto method =
          javaClassStatic()->getMethod<void(std::string, std::string)>(
            "onStepFailed");
        method(self(), step, errorMessage);
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }
  };

  class AndroidStatoStateUpdateListener : public StatoStateUpdateListener {
  public:
    AndroidStatoStateUpdateListener(jni::alias_ref<JStatoStateUpdateListener> stateListener);

    void onUpdate();

  private:
    jni::global_ref<JStatoStateUpdateListener> jStateListener;
  };

  class JStatoPluginWrapper : public StatoPlugin {
  private:
    std::atomic_bool connected {false};

  public:
    jni::global_ref<JStatoPlugin> jplugin;

    virtual std::string identifier() const override {
      return jplugin->identifier();
    }

    virtual void didConnect(std::shared_ptr<StatoPluginConnection> conn) override {
      connected = true;
      jplugin->didConnect(conn);
    }

    virtual void didDisconnect() override {
      connected = false;
      jplugin->didDisconnect();
    }

    bool isConnected() override {
      //infoStream() << "Connected plugin: "
      return connected;
    }
    virtual bool runInBackground() override {
      return jplugin->runInBackground();
    }

    JStatoPluginWrapper(jni::global_ref<JStatoPlugin> plugin) : jplugin(plugin) {}
  };

  struct JStateSummary : public jni::JavaClass<JStateSummary> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StateSummary;";

    static jni::local_ref<JStateSummary> create() {
      return newInstance();
    }

    void addEntry(std::string name, std::string state) {
      static const auto method = javaClassStatic()->getMethod<void(std::string, std::string)>(
        "addEntry");
      return method(self(), name, state);
    }

  };


  class JStatoDefaultClient : public jni::HybridClass<JStatoDefaultClient> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoDefaultClient;";

    static void registerNatives() {
      registerHybrid({
        makeNativeMethod("initNative", JStatoDefaultClient::init),
        makeNativeMethod("start", JStatoDefaultClient::start),
        makeNativeMethod("stop", JStatoDefaultClient::stop),
        makeNativeMethod("addPluginNative", JStatoDefaultClient::addPlugin),
        makeNativeMethod("removePluginNative", JStatoDefaultClient::removePlugin),
        makeNativeMethod(
          "subscribeForUpdates", JStatoDefaultClient::subscribeForUpdates),
        makeNativeMethod("unsubscribe", JStatoDefaultClient::unsubscribe),
        makeNativeMethod("getPlugin", JStatoDefaultClient::getPlugin),
        makeNativeMethod("getState", JStatoDefaultClient::getState),
        makeNativeMethod("getStateSummary", JStatoDefaultClient::getStateSummary),
      });
    }

//    static jni::alias_ref<JStatoDefaultClient::javaobject> getInstance(jni::alias_ref<jclass>) {
//      try {
//        static auto client = make_global(newObjectCxxArgs());
//        return client;
//      } catch (const std::exception &e) {
//        return nullptr;
//      }
//    }


    void start() {
      try {
        getClient()->start();
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void stop() {
      try {
        getClient()->stop();
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void addPlugin(jni::alias_ref<JStatoPlugin> plugin) {
      try {
        auto wrapper =
          std::make_shared<JStatoPluginWrapper>(make_global(plugin));
        getClient()->addPlugin(wrapper);
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void removePlugin(jni::alias_ref<JStatoPlugin> plugin) {
      try {
        auto client = getClient();
        client->removePlugin(client->getPlugin(plugin->identifier()));
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void subscribeForUpdates(jni::alias_ref<JStatoStateUpdateListener> stateListener) {
      try {
        auto client = getClient();
        mStateListener =
          std::make_shared<AndroidStatoStateUpdateListener>(stateListener);
        client->setStateListener(mStateListener);
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    void unsubscribe() {
      try {
        auto client = getClient();
        mStateListener = nullptr;
        client->setStateListener(nullptr);
      } catch (const std::exception &e) {
        handleException(e);
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
      }
    }

    std::string getState() {
      try {
        return getClient()->getState();
      } catch (const std::exception &e) {
        handleException(e);
        return "";
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
        return "";
      }
    }

    jni::global_ref<JStateSummary::javaobject> getStateSummary() {
      try {
        auto summary = jni::make_global(JStateSummary::create());
        auto elements = getClient()->getStateElements();
        for (auto &&element : elements) {
          std::string status;
          switch (element.state) {
            case State::in_progress:
              status = "IN_PROGRESS";
              break;
            case State::failed:
              status = "FAILED";
              break;
            case State::success:
              status = "SUCCESS";
              break;
          }
          summary->addEntry(element.name, status);
        }
        return summary;
      } catch (const std::exception &e) {
        handleException(e);
        return nullptr;
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
        return nullptr;
      }
    }

    jni::alias_ref<JStatoPlugin> getPlugin(const std::string &identifier) {
      try {
        auto plugin = getClient()->getPlugin(identifier);
        if (plugin) {
          auto wrapper = std::static_pointer_cast<JStatoPluginWrapper>(plugin);
          return wrapper->jplugin;
        } else {
          return nullptr;
        }
      } catch (const std::exception &e) {
        handleException(e);
        return nullptr;
      } catch (const std::exception *e) {
        if (e) {
          handleException(*e);
        }
        return nullptr;
      }
    }

//
    //jni::alias_ref<jclass>,
    void init(
      JStatoEventBase *callbackWorker,
      JStatoEventBase *connectionWorker,
      int insecurePort,
      int securePort,
      const std::string host,
      const std::string os,
      const std::string device,
      const std::string deviceId,
      const std::string appName,
      const std::string appPackage
    ) {

      SDKState state;
      SDKConfig config;
      config.set_host(std::move(host));
      config.set_insecure_port(insecurePort);
      config.set_secure_port(securePort);

      state.set_os(OSAndroid);
      state.set_node_id(deviceId);
      state.set_node_name(device);
      state.set_app_name(appName);
      state.set_app_package(appPackage);

      StatoClientInit init(state, config);
      init.callbackWorker = callbackWorker->eventBase();
      init.connectionWorker = connectionWorker->eventBase();

      getClient()->init(init);
    }

  private:
    friend HybridBase;
    std::shared_ptr<StatoStateUpdateListener> mStateListener = nullptr;

    JStatoDefaultClient() {}
  };

  class JStatoDefaultClientFactory : public jni::HybridClass<JStatoDefaultClientFactory> {
  public:
    constexpr static auto kJavaDescriptor = "Lorg/stato/core/StatoDefaultClientFactory;";

    static void registerNatives() {
      registerHybrid({
        makeNativeMethod("initHybrid", JStatoDefaultClientFactory::initHybrid),
        makeNativeMethod("makeDefaultClient", JStatoDefaultClientFactory::makeDefaultClient)
      });

    }

    static void initHybrid(jni::alias_ref<jhybridobject> o) {
      return setCxxInstance(o);
    }

    jni::global_ref<JStatoDefaultClient::javaobject> makeDefaultClient() {
      try {
        static auto client = make_global(JStatoDefaultClient::newObjectCxxArgs());
        return client;
      } catch (const std::exception &e) {
        return nullptr;
      }
    }

  private:
    friend HybridClass;

    JStatoDefaultClientFactory() {}
  };

} // namespace


jint JNI_OnLoad(JavaVM *vm, void *) {
  return jni::initialize(vm, [] {
    JStatoDefaultClient::registerNatives();
    JStatoPluginConnectionImpl::registerNatives();
    JStatoResponderImpl::registerNatives();
    JStatoEventBase::registerNatives();
    JStatoDefaultClientFactory::registerNatives();
  });
}

AndroidStatoStateUpdateListener::AndroidStatoStateUpdateListener(
  jni::alias_ref<JStatoStateUpdateListener> stateListener) {
  jStateListener = jni::make_global(stateListener);
}

void AndroidStatoStateUpdateListener::onUpdate() {
  jStateListener->onUpdate();
}

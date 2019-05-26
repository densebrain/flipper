/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <memory>

#ifdef STATES_OSS
#include <fbjni/fbjni.h>
#else
#include <fb/fbjni.h>
#endif

#include <folly/json.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/EventBaseManager.h>

#include <States/StatesClient.h>
#include <States/StatesConnectionManager.h>
#include <States/StatesConnection.h>
#include <States/StatesResponder.h>
#include <States/StatesStateUpdateListener.h>
#include <States/StatesState.h>

using namespace facebook;
using namespace facebook::states;

namespace {

void handleException(const std::exception& e) {
  // TODO: T35898390, report and log the exception in scribe
  // TODO: T35898500, send states notification
  std::string message = "Exception caught in C++ and suppressed: ";
  message += e.what();
  __android_log_write(ANDROID_LOG_ERROR, "STATES", message.c_str());
}

class JEventBase : public jni::HybridClass<JEventBase> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/android/EventBase;";

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JEventBase::initHybrid),
        makeNativeMethod("loopForever", JEventBase::loopForever),
    });
  }

  folly::EventBase* eventBase() {
    return &eventBase_;
  }

 private:
  friend HybridBase;

  JEventBase() {}

  void loopForever() {
    folly::EventBaseManager::get()->setEventBase(&eventBase_, false);
    eventBase_.loopForever();
  }

  static void initHybrid(jni::alias_ref<jhybridobject> o) {
    return setCxxInstance(o);
  }

  folly::EventBase eventBase_;
};

class JStatesObject : public jni::JavaClass<JStatesObject> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/core/StatesObject;";

  static jni::local_ref<JStatesObject> create(const folly::dynamic& json) {
    return newInstance(folly::toJson(json));
  }

  std::string toJsonString() {
    static const auto method = javaClassStatic()->getMethod<std::string()>("toJsonString");
    return method(self())->toStdString();
  }
};

class JStatesArray : public jni::JavaClass<JStatesArray> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/core/StatesArray;";

  static jni::local_ref<JStatesArray> create(const folly::dynamic& json) {
    return newInstance(folly::toJson(json));
  }

  std::string toJsonString() {
    static const auto method = javaClassStatic()->getMethod<std::string()>("toJsonString");
    return method(self())->toStdString();
  }
};

class JStatesResponder : public jni::JavaClass<JStatesResponder> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/core/StatesResponder;";
};

class JStatesResponderImpl : public jni::HybridClass<JStatesResponderImpl, JStatesResponder> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/android/StatesResponderImpl;";

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("successObject", JStatesResponderImpl::successObject),
      makeNativeMethod("successArray", JStatesResponderImpl::successArray),
      makeNativeMethod("error", JStatesResponderImpl::error),
    });
  }

  void successObject(jni::alias_ref<JStatesObject> json) {
    _responder->success(json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object());
  }

  void successArray(jni::alias_ref<JStatesArray> json) {
    _responder->success(json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object());
  }

  void error(jni::alias_ref<JStatesObject> json) {
    _responder->error(json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object());
  }

 private:
  friend HybridBase;
  std::shared_ptr<StatesResponder> _responder;

  JStatesResponderImpl(std::shared_ptr<StatesResponder> responder): _responder(std::move(responder)) {}
};

class JStatesReceiver : public jni::JavaClass<JStatesReceiver> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/core/StatesReceiver;";

  void receive(const folly::dynamic params, std::shared_ptr<StatesResponder> responder) const {
    static const auto method = javaClassStatic()->getMethod<void(jni::alias_ref<JStatesObject::javaobject>, jni::alias_ref<JStatesResponder::javaobject>)>("onReceive");
    method(self(), JStatesObject::create(std::move(params)), JStatesResponderImpl::newObjectCxxArgs(responder));
  }
};

class JStatesConnection : public jni::JavaClass<JStatesConnection> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/core/StatesConnection;";
};

class JStatesConnectionImpl : public jni::HybridClass<JStatesConnectionImpl, JStatesConnection> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/android/StatesConnectionImpl;";

  static void registerNatives() {
    registerHybrid({
      makeNativeMethod("sendObject", JStatesConnectionImpl::sendObject),
      makeNativeMethod("sendArray", JStatesConnectionImpl::sendArray),
      makeNativeMethod("reportError", JStatesConnectionImpl::reportError),
      makeNativeMethod("receive", JStatesConnectionImpl::receive),
    });
  }

  void sendObject(const std::string method, jni::alias_ref<JStatesObject> json) {
    _connection->send(std::move(method), json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object());
  }

  void sendArray(const std::string method, jni::alias_ref<JStatesArray> json) {
    _connection->send(std::move(method), json ? folly::parseJson(json->toJsonString()) : folly::dynamic::object());
  }

  void reportError(jni::alias_ref<jni::JThrowable> throwable) {
    _connection->error(throwable->toString(), throwable->getStackTrace()->toString());
  }

  void receive(const std::string method, jni::alias_ref<JStatesReceiver> receiver) {
    auto global = make_global(receiver);
    _connection->receive(std::move(method), [global] (const folly::dynamic& params, std::shared_ptr<StatesResponder> responder) {
      global->receive(params, responder);
    });
  }

 private:
  friend HybridBase;
  std::shared_ptr<StatesConnection> _connection;

  JStatesConnectionImpl(std::shared_ptr<StatesConnection> connection): _connection(std::move(connection)) {}
};

class JStatesPlugin : public jni::JavaClass<JStatesPlugin> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/core/StatesPlugin;";

  std::string identifier() const {
    static const auto method = javaClassStatic()->getMethod<std::string()>("getId");
    try {
      return method(self())->toStdString();

    } catch (const std::exception& e) {
      handleException(e);
      return "";
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
      return "";
    }
  }

  void didConnect(std::shared_ptr<StatesConnection> conn) {
    auto method =
        javaClassStatic()
            ->getMethod<void(jni::alias_ref<JStatesConnection::javaobject>)>(
                "onConnect");
    try {
      method(self(), JStatesConnectionImpl::newObjectCxxArgs(conn));
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }

  void didDisconnect() {
    static const auto method = javaClassStatic()->getMethod<void()>("onDisconnect");
    try {
      method(self());
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
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
      } catch (const std::exception& e) {
        handleException(e);
        return false;
      } catch (const std::exception* e) {
        if (e) {
          handleException(*e);
        }
        return false;
      }
    }
};

class JStatesStateUpdateListener : public jni::JavaClass<JStatesStateUpdateListener> {
 public:
  constexpr static auto  kJavaDescriptor = "Lcom/facebook/states/core/StatesStateUpdateListener;";

  void onUpdate() {
    try {
      static const auto method =
          javaClassStatic()->getMethod<void()>("onUpdate");
      method(self());
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
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
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
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
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
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
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }
};

class AndroidStatesStateUpdateListener : public StatesStateUpdateListener {
 public:
  AndroidStatesStateUpdateListener(jni::alias_ref<JStatesStateUpdateListener> stateListener);
  void onUpdate();

  private:
   jni::global_ref<JStatesStateUpdateListener> jStateListener;
};

class JStatesPluginWrapper : public StatesPlugin {
 public:
  jni::global_ref<JStatesPlugin> jplugin;

  virtual std::string identifier() const override {
    return jplugin->identifier();
  }

  virtual void didConnect(std::shared_ptr<StatesConnection> conn) override {
    jplugin->didConnect(conn);
  }

  virtual void didDisconnect() override {
    jplugin->didDisconnect();
  }

    virtual bool runInBackground() override {
        return jplugin->runInBackground();
    }

  JStatesPluginWrapper(jni::global_ref<JStatesPlugin> plugin): jplugin(plugin) {}
};

struct JStateSummary : public jni::JavaClass<JStateSummary> {
public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/core/StateSummary;";

  static jni::local_ref<JStateSummary> create() {
    return newInstance();
  }

  void addEntry(std::string name, std::string state) {
    static const auto method = javaClassStatic()->getMethod<void(std::string, std::string)>("addEntry");
    return method(self(), name, state);
  }

};

class JStatesClient : public jni::HybridClass<JStatesClient> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/states/android/StatesClientImpl;";

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("init", JStatesClient::init),
        makeNativeMethod("getInstance", JStatesClient::getInstance),
        makeNativeMethod("start", JStatesClient::start),
        makeNativeMethod("stop", JStatesClient::stop),
        makeNativeMethod("addPluginNative", JStatesClient::addPlugin),
        makeNativeMethod("removePluginNative", JStatesClient::removePlugin),
        makeNativeMethod(
            "subscribeForUpdates", JStatesClient::subscribeForUpdates),
        makeNativeMethod("unsubscribe", JStatesClient::unsubscribe),
        makeNativeMethod("getPlugin", JStatesClient::getPlugin),
        makeNativeMethod("getState", JStatesClient::getState),
        makeNativeMethod("getStateSummary", JStatesClient::getStateSummary),
    });
  }

  static jni::alias_ref<JStatesClient::javaobject> getInstance(jni::alias_ref<jclass>) {
    try {
      static auto client = make_global(newObjectCxxArgs());
      return client;
    } catch (const std::exception& e) {
      return nullptr;
    }
  }

  void start() {
    try {
      StatesClient::instance()->start();
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }

  void stop() {
    try {
      StatesClient::instance()->stop();
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }

  void addPlugin(jni::alias_ref<JStatesPlugin> plugin) {
    try {
      auto wrapper =
          std::make_shared<JStatesPluginWrapper>(make_global(plugin));
      StatesClient::instance()->addPlugin(wrapper);
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }

  void removePlugin(jni::alias_ref<JStatesPlugin> plugin) {
    try {
      auto client = StatesClient::instance();
      client->removePlugin(client->getPlugin(plugin->identifier()));
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }

  void subscribeForUpdates(jni::alias_ref<JStatesStateUpdateListener> stateListener) {
    try {
      auto client = StatesClient::instance();
      mStateListener =
          std::make_shared<AndroidStatesStateUpdateListener>(stateListener);
      client->setStateListener(mStateListener);
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }

  void unsubscribe() {
    try {
      auto client = StatesClient::instance();
      mStateListener = nullptr;
      client->setStateListener(nullptr);
    } catch (const std::exception& e) {
      handleException(e);
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
    }
  }

  std::string getState() {
    try {
      return StatesClient::instance()->getState();
    } catch (const std::exception& e) {
      handleException(e);
      return "";
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
      return "";
    }
  }

  jni::global_ref<JStateSummary::javaobject> getStateSummary() {
    try {
      auto summary = jni::make_global(JStateSummary::create());
      auto elements = StatesClient::instance()->getStateElements();
      for (auto&& element : elements) {
        std::string status;
        switch (element.state_) {
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
        summary->addEntry(element.name_, status);
      }
      return summary;
    } catch (const std::exception& e) {
      handleException(e);
      return nullptr;
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
      return nullptr;
    }
  }

  jni::alias_ref<JStatesPlugin> getPlugin(const std::string& identifier) {
    try {
      auto plugin = StatesClient::instance()->getPlugin(identifier);
      if (plugin) {
        auto wrapper = std::static_pointer_cast<JStatesPluginWrapper>(plugin);
        return wrapper->jplugin;
      } else {
        return nullptr;
      }
    } catch (const std::exception& e) {
      handleException(e);
      return nullptr;
    } catch (const std::exception* e) {
      if (e) {
        handleException(*e);
      }
      return nullptr;
    }
  }


  static void init(
      jni::alias_ref<jclass>,
      JEventBase* callbackWorker,
      JEventBase* connectionWorker,
      int insecurePort,
      int securePort,
      const std::string host,
      const std::string os,
      const std::string device,
      const std::string deviceId,
      const std::string app,
      const std::string appId,
      const std::string privateAppDirectory) {
    StatesClient::init({{std::move(host),
                          std::move(os),
                          std::move(device),
                          std::move(deviceId),
                          std::move(app),
                          std::move(appId),
                          std::move(privateAppDirectory)},
                         callbackWorker->eventBase(),
                         connectionWorker->eventBase(),
                         insecurePort,
                         securePort});
  }

 private:
  friend HybridBase;
  std::shared_ptr<StatesStateUpdateListener> mStateListener = nullptr;
  JStatesClient() {}
};

} // namespace

jint JNI_OnLoad(JavaVM* vm, void*) {
  return jni::initialize(vm, [] {
    JStatesClient::registerNatives();
    JStatesConnectionImpl::registerNatives();
    JStatesResponderImpl::registerNatives();
    JEventBase::registerNatives();
  });
}

AndroidStatesStateUpdateListener::AndroidStatesStateUpdateListener(jni::alias_ref<JStatesStateUpdateListener> stateListener) {
  jStateListener = jni::make_global(stateListener);
}

void AndroidStatesStateUpdateListener::onUpdate() {
  jStateListener->onUpdate();
}

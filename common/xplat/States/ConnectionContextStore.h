/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <string>
#include <folly/io/async/SSLContext.h>
#include <folly/dynamic.h>
#include "StatesInitConfig.h"

using namespace folly;

namespace facebook {
namespace states {

class ConnectionContextStore {

public:
  ConnectionContextStore(DeviceData deviceData);
  bool hasRequiredFiles();
  std::string getCertificateSigningRequest();
  std::shared_ptr<SSLContext> getSSLContext();
  std::string getCertificateDirectoryPath();
  std::string getDeviceId();
  void storeConnectionConfig(folly::dynamic& config);

 private:
  DeviceData deviceData_;
  std::string csr = "";

  std::string absoluteFilePath(const char* filename);
  bool resetStatesDir();
};

} // namespace states
} // namespace facebook

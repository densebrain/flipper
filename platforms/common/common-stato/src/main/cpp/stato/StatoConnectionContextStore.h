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
#include <stato/StatoClientInit.h>
#include <stato-models/SDKState.pb.h>
#include <stato-models/Payload.pb.h>
using namespace folly;


namespace stato {

  using namespace models;

  class StatoConnectionContextStore   {

    public:
    StatoConnectionContextStore(const SDKState & sdkState);

    std::string getCertificateSigningRequest();
    std::shared_ptr<SSLContext> getSSLContext();


    std::string getClientCertificate();
    std::string getCACertificate();
    std::string getPrivateKey();

    std::string getDeviceId();

    void storeCertificates(const CertificateExchangeResponse & response);
    bool isReady();

    const std::string & getConnectionId();

    private:
    SDKState sdkState {};
    std::string connectionId {""};
    std::string csr {""};
    std::string clientCert {""};
    std::string caCert {""};
    std::string privateKey {""};

  };

} // namespace stato


/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <stato/StatoConnectionContextStore.h>
#include <folly/json.h>
#include <folly/portability/SysStat.h>
#include <stdio.h>
#include <fstream>
#include <iostream>
#include <stato/CertificateUtils.h>
#include <stato/Log.h>

namespace stato {
  using namespace stato::logger;


  StatoConnectionContextStore::StatoConnectionContextStore(
    const SDKState &sdkState
  ) {
    this->sdkState.CopyFrom(sdkState);
    //SSLHelper::createCertSigningRequest(deviceData_.appPackage);
    auto [key, csr] = generateCertSigningRequest(sdkState.app_package());

    this->privateKey = key;
    this->csr = csr;

    if (csr.empty() || key.empty()) {
      throw std::runtime_error("Failed to generate CSR");
    }
  }


  bool StatoConnectionContextStore::isReady() {
    return !caCert.empty() && !clientCert.empty() && !privateKey.empty();
  }

  std::string StatoConnectionContextStore::getClientCertificate() {
    return clientCert;
  }

  std::string StatoConnectionContextStore::getCACertificate() {
    return caCert;
  }

  std::string StatoConnectionContextStore::getPrivateKey() {
    return privateKey;
  }

  std::string StatoConnectionContextStore::getCertificateSigningRequest() {
    if (csr != "" && privateKey != "") {
      return csr;
    }

    return csr;
  }


  std::shared_ptr<SSLContext> StatoConnectionContextStore::getSSLContext() {
    std::shared_ptr<folly::SSLContext> sslContext = std::make_shared<folly::SSLContext>();

    const char *pemCertString = caCert.c_str();///..... (includes "-----BEGIN/END CERTIFICATE-----")
    size_t certLen = strlen(pemCertString);

    X509 *certX509 = NULL;

    BIO *certBio = BIO_new_mem_buf((void *) pemCertString, certLen);//BIO_new(BIO_s_mem());

    auto cleanup = [certX509, certBio] {
      BIO_free(certBio);
      X509_free(certX509);
    };

    if (certBio == NULL) {
      errorStream() << "BIO_new.";
      cleanup();
      throw std::runtime_error("unable to create new X509 store");
    }
    BIO_write(certBio, pemCertString, certLen);

    if (!PEM_read_bio_X509(certBio, &certX509, NULL, NULL)) {
      errorStream() << "unable to parse certificate in memory";
      cleanup();
      throw std::runtime_error("unable to parse cert");
    }

    auto sslContextInner = sslContext->getSSLCtx();
    X509_STORE *sslStore = SSL_CTX_get_cert_store(sslContextInner);
    X509_STORE_add_cert(sslStore, certX509);

    sslContext->setVerificationOption(folly::SSLContext::SSLVerifyPeerEnum::VERIFY);
    sslContext->loadCertKeyPairFromBufferPEM(clientCert.c_str(), privateKey.c_str());

    sslContext->authenticate(true, false);
    cleanup();

    return sslContext;
  }

  std::string StatoConnectionContextStore::getDeviceId() {
    /**
     * On android we can't reliably get the serial of the current device
     * So rely on our locally written config, which is provided by the
     * desktop app.
     *
     * For backwards compatibility, when this isn't present, fall back to the
     * unreliable source.
     **/

    return sdkState.node_id();
  }

  void StatoConnectionContextStore::storeCertificates(const CertificateExchangeResponse & response) {
    caCert = response.ca_cert();
    clientCert = response.client_cert();
    connectionId = response.connection_id();

  }

  const std::string &StatoConnectionContextStore::getConnectionId() {
    return connectionId;
  }
}
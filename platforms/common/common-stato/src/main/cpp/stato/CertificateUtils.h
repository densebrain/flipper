/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#ifndef CertificateUtils_hpp
#define CertificateUtils_hpp

#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <stdio.h>
#include <string>
#include <utility>


namespace stato {
  std::tuple<std::string, std::string> generateCertSigningRequest(const std::string& appPackage);
}
#endif /* CertificateUtils_hpp */

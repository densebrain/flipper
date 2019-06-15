/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include <stato/CertificateUtils.h>

#include <fcntl.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <folly/portability/SysStat.h>
#include <folly/portability/Fcntl.h>
#include <cstring>

namespace stato {

  static void freeSSLResources(EVP_PKEY *pKey, X509_REQ *x509_req, BIGNUM *bne, BIO *csrBio);

  std::tuple<std::string, std::string> generateCertSigningRequest(const std::string& appPackage) {
    //char appIdBuf[2048];
    //memcpy(appIdBuf, appPackage.c_str(), 4);
    //char * appIdBuf = ;
    int ret = 0;
    BIGNUM *bne = NULL;

    int nVersion = 1;
    int bits = 2048;

    char outBuf[819200];
    // Using 65537 as exponent
    unsigned long e = RSA_F4;

    X509_NAME *x509_name = NULL;

    const char *subjectCountry = "US";
    const char *subjectProvince = "CA";
    const char *subjectCity = "New York";
    const char *subjectOrganization = "Stato OSS";
    const char *subjectCommon = appPackage.c_str();

    X509_REQ *x509_req = X509_REQ_new();
    EVP_PKEY *pKey = EVP_PKEY_new();
    RSA *rsa = RSA_new();
    //BIO *privateKey = NULL;
    BIO *outBio = NULL;

    EVP_PKEY_assign_RSA(pKey, rsa);

    // Generate rsa key
    bne = BN_new();
    BN_set_flags(bne, BN_FLG_CONSTTIME);
    ret = BN_set_word(bne, e);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret = RSA_generate_key_ex(rsa, bits, bne, NULL);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    memset(outBuf, 0, sizeof(outBuf));

    //outBio = BIO_new_mem_buf(outBuf, -1);// BIO_new(  );//BIO_new_mem_buf(outBuf, -1);
    outBio = BIO_new(BIO_s_mem());
    ret = PEM_write_bio_RSAPrivateKey(outBio, rsa, NULL, NULL, 0, NULL, NULL);;
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Unable to write private key to mem");
    }

    //BIO_flush(outBio);
    ret = BIO_read(outBio, outBuf, sizeof(outBuf));

    std::string keyStr = (ret > 0) ? std::string(outBuf, strlen(outBuf)) : "";
    //BIO_free_all(outBio);

    //  //{
    //  //  // Write private key to a file
    //  //  int privateKeyFd = open(privateKeyFile, O_CREAT | O_WRONLY, S_IWUSR | S_IRUSR);
    //  //  if (privateKeyFd < 0) {
    //  //    free(pKey, x509_req, bne, privateKey, csrBio);
    //  //    return -1;
    //  //  }
    //  //  FILE *privateKeyFp = fdopen(privateKeyFd, "w");
    //  //  if (privateKeyFp == NULL) {
    //  //    free(pKey, x509_req, bne, privateKey, csrBio);
    //  //    return -1;
    //  //  }
    //  //  privateKey = BIO_new_fp(privateKeyFp, BIO_CLOSE);
    //  //  ret = PEM_write_bio_RSAPrivateKey(privateKey, rsa, NULL, NULL, 0, NULL, NULL);
    //  //  if (ret != 1) {
    //  //    free(pKey, x509_req, bne, privateKey, csrBio);
    //  //    return ret;
    //  //  }
    //  //}
    //
    rsa = NULL;

    ret = BIO_flush(outBio);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret = X509_REQ_set_version(x509_req, nVersion);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    x509_name = X509_REQ_get_subject_name(x509_req);

    ret = X509_NAME_add_entry_by_txt(x509_name, "C", MBSTRING_ASC, (const unsigned char *) subjectCountry, -1, -1, 0);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret = X509_NAME_add_entry_by_txt(x509_name, "ST", MBSTRING_ASC, (const unsigned char *) subjectProvince, -1, -1, 0);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret = X509_NAME_add_entry_by_txt(x509_name, "L", MBSTRING_ASC, (const unsigned char *) subjectCity, -1, -1, 0);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret =
      X509_NAME_add_entry_by_txt(x509_name, "O", MBSTRING_ASC, (const unsigned char *) subjectOrganization, -1, -1, 0);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret = X509_NAME_add_entry_by_txt(x509_name, "CN", MBSTRING_ASC, (const unsigned char *) subjectCommon, -1, -1, 0);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret = X509_REQ_set_pubkey(x509_req, pKey);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Error");
    }

    ret = X509_REQ_sign(x509_req, pKey, EVP_sha256()); // returns x509_req->signature->length
    if (ret <= 0) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Unable to write csr to mem, sign");
    }




    //memset(outBuf, 0, sizeof(outBuf));

    //outBio = BIO_new_mem_buf(outBuf, sizeof(outBuf));

    ret = PEM_write_bio_X509_REQ(outBio, x509_req);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Unable to write csr to mem, csrBio");
    }

    ret = BIO_read(outBio, outBuf, sizeof(outBuf));

    std::string csrStr = (ret > 0) ? std::string(outBuf, strlen(outBuf)) : "";
    BIO_flush(outBio);
    //std::string csrStr(outBuf, strlen(outBuf));
    //BIO_free_all(outBio);

    //  {
    //    // Write CSR to a file
    //    int csrFd = open(csrFile, O_CREAT | O_WRONLY, S_IWUSR | S_IRUSR);
    //    if (csrFd < 0) {
    //      free(pKey, x509_req, bne, privateKey, csrBio);
    //      return -1;
    //    }
    //    FILE *csrFp = fdopen(csrFd, "w");
    //    if (csrFp == NULL) {
    //      free(pKey, x509_req, bne, privateKey, csrBio);
    //      return -1;
    //    }
    //    csrBio = BIO_new_fp(csrFp, BIO_CLOSE);
    //    ret = PEM_write_bio_X509_REQ(csrBio, x509_req);
    //    if (ret != 1) {
    //      free(pKey, x509_req, bne, privateKey, csrBio);
    //      return ret;
    //    }
    //  }

    ret = BIO_flush(outBio);
    if (ret != 1) {
      freeSSLResources(pKey, x509_req, bne, outBio);
      throw std::domain_error("Unable to flush to the key, csrBio");
    }
    //std::string keyStr = "1234";
    //std::string csrStr = "1234";
    std::tuple<std::string, std::string> keyAndCert = {std::string(keyStr), std::string(csrStr)};
    return keyAndCert;
  }

  static void freeSSLResources(EVP_PKEY *pKey, X509_REQ *x509_req, BIGNUM *bne, BIO *outBio) {
    BN_free(bne);
    X509_REQ_free(x509_req);
    EVP_PKEY_free(pKey);
    BIO_free_all(outBio);

  }
}
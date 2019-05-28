#include <Stato/ConnectionContextStore.h>

namespace facebook {
namespace stato {
namespace test {

  class ConnectionContextStoreMock : public ConnectionContextStore {
    public:
      ConnectionContextStoreMock() : ConnectionContextStore(DeviceData()) {
      }
      bool hasRequiredFiles() {
        return true;
      }
      std::string createCertificateSigningRequest() {
        return "thisIsACsr";
      }
      std::shared_ptr<SSLContext> getSSLContext() {
        return nullptr;
      }
      dynamic getConnectionConfig() {
        return nullptr;
      }
      std::string getCertificateDirectoryPath() {
        return "/something/sonar/";
      }
  };

}}}

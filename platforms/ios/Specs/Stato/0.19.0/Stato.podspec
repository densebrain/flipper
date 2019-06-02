statokit_version = '0.19.0'
Pod::Spec.new do |spec|
  spec.name = 'Stato'
  spec.version = statokit_version
  spec.license = { :type => 'MIT' }
  spec.homepage = 'https://github.com/facebook/sonar'
  spec.summary = 'SonarKit core cpp code with network implementation'
  spec.authors = 'Facebook'
  spec.source = { :git => 'https://github.com/facebook/Sonar.git',
                  :tag => 'v'+statokit_version }
  spec.module_name = 'Stato'
  spec.public_header_files = 'xplat/Stato/*.h','xplat/utils/*.h'
  spec.source_files = 'xplat/Stato/*.{h,cpp,m,mm}','xplat/Stato/utils/*.{h,cpp,m,mm}'
  spec.libraries = "stdc++"
  spec.dependency 'Stato-Folly', '~>1.2'
  spec.dependency 'Stato-RSocket', '~>0.10'
  spec.compiler_flags = '-DSTATO_OSS=1 -DFB_SONARKIT_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_HAVE_LIBGFLAGS=0 -DFOLLY_HAVE_LIBJEMALLOC=0 -DFOLLY_HAVE_PREADV=0 -DFOLLY_HAVE_PWRITEV=0 -DFOLLY_HAVE_TFO=0 -DFOLLY_USE_SYMBOLIZER=0 -Wall
    -std=c++14
    -Wno-global-constructors'
  spec.platforms = { :ios => "8.0" }
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/Stato-RSocket\" \"$(PODS_ROOT)/DoubleConversion\"" }
end

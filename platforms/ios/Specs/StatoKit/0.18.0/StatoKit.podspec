folly_compiler_flags = '-DSTATES_OSS=1 -DFB_SONARKIT_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_HAVE_LIBGFLAGS=0 -DFOLLY_HAVE_LIBJEMALLOC=0 -DFOLLY_HAVE_PREADV=0 -DFOLLY_HAVE_PWRITEV=0 -DFOLLY_HAVE_TFO=0 -DFOLLY_USE_SYMBOLIZER=0'
yoga_version = '~> 1.9'
yogakit_version = '~>1.10'
statokit_version = '0.18.0'
Pod::Spec.new do |spec|
  spec.name = 'StatoKit'
  spec.version = statokit_version
  spec.license = { :type => 'MIT' }
  spec.homepage = 'https://github.com/facebook/Sonar'
  spec.summary = 'Sonar iOS podspec'
  spec.authors = 'Facebook'
  spec.static_framework = true
  spec.source = { :git => 'https://github.com/facebook/Sonar.git',
                  :tag=> "v"+statokit_version }
  spec.module_name = 'StatoKit'
  spec.platforms = { :ios => "8.4" }
  spec.default_subspecs = "Core"

  # This subspec is necessary since FBDefines.h is imported as <FBDefines/FBDefines.h>
  # inside SKMacros.h, which is a public header file. Defining this directory as a
  # subspec with header_dir = 'FBDefines' allows this to work, even though it wouldn't
  # generally (you would need to import <StatoKit/t/FBDefines/FBDefines.h>)
  spec.subspec 'FBDefines' do |ss|
    ss.header_dir = 'FBDefines'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/FBDefines/**/*.h'
    ss.public_header_files = 'iOS/FBDefines/**/*.h'
  end

  spec.subspec 'CppBridge' do |ss|
    ss.header_dir = 'CppBridge'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatoKit/CppBridge/**/*.{h,mm}'
    # We set these files as private headers since they only need to be accessed
    # by other StatoKit source files
    ss.private_header_files = 'iOS/StatoKit/CppBridge/**/*.h'
    ss.preserve_path = 'StatoKit/CppBridge/**/*.h'
  end

  spec.subspec 'FBCxxUtils' do |ss|
    ss.header_dir = 'FBCxxUtils'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatoKit/FBCxxUtils/**/*.{h,mm}'
    # We set these files as private headers since they only need to be accessed
    # by other StatoKit source files
    ss.private_header_files = 'iOS/StatoKit/FBCxxUtils/**/*.h'
  end

  spec.subspec "FKPortForwarding" do |ss|
    ss.header_dir = "FKPortForwarding"
    ss.dependency 'CocoaAsyncSocket', '~> 7.6'
    ss.dependency 'PeerTalk', '~>0.0.2'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatoKit/FKPortForwarding/FKPortForwarding{Server,Common}.{h,m}'
    ss.private_header_files = 'iOS/StatoKit/FKPortForwarding/FKPortForwarding{Server,Common}.h'
  end


  spec.subspec "Core" do |ss|
    ss.dependency 'StatoKit/FBDefines'
    ss.dependency 'StatoKit/FBCxxUtils'
    ss.dependency 'StatoKit/CppBridge'
    ss.dependency 'StatoKit/FKPortForwarding'
    ss.dependency 'Stato-Folly', '~>1.2'
    ss.dependency 'Stato', '~>'+statokit_version
    ss.dependency 'OpenSSL-Static', '1.0.2.c1'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatoKit/FBDefines/*.{h,cpp,m,mm}', 'iOS/StatoKit/CppBridge/*.{h,mm}', 'iOS/StatoKit/FBCxxUtils/*.{h,mm}', 'iOS/StatoKit/*.{h,m,mm}'
    ss.public_header_files = 'iOS/Plugins/StatoKitNetworkPlugin/SKIOSNetworkPlugin/SKIOSNetworkAdapter.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKBufferingPlugin.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKNetworkReporter.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKRequestInfo.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKResponseInfo.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/StatoKitNetworkPlugin.h',
                             'iOS/Plugins/StatoKitUserDefaultsPlugin/FKUserDefaultsPlugin.h',
                             'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/StatoKitLayoutPlugin.h',
                             'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKTapListener.h',
                             'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKInvalidation.h',
                             'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKDescriptorMapper.h',
                             'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutComponentKitSupport/StatoKitLayoutComponentKitSupport.h',
                             'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutComponentKitSupport/SKSubDescriptor.h',
                             'iOS/FBDefines/FBDefines.h',
                             'iOS/Plugins/StatoKitExamplePlugin/StatoKitExamplePlugin/StatoKitExamplePlugin.h',
                             'iOS/Plugins/StatoKitCrashReporterPlugin/StatoKitCrashReporterPlugin/StatoKitCrashReporterPlugin.h',
                             'iOS/StatoKit/**/{StatoDiagnosticsViewController,StatoStateUpdateListener,StatoClient,StatoPlugin,StatoConnection,StatoResponder,SKMacros}.h'
    header_search_paths = "\"$(PODS_ROOT)/StatoKit/iOS/StatoKit\" \"$(PODS_ROOT)\"/Headers/Private/StatoKit/** \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/PeerTalkSonar\""
    ss.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                             "DEFINES_MODULE" => "YES",
                             "HEADER_SEARCH_PATHS" => header_search_paths }
  end

  spec.subspec "StatoKitLayoutPlugin" do |ss|
    ss.header_dir = "StatoKitLayoutPlugin"
    ss.dependency             'StatoKit/Core'
    ss.dependency             'Yoga', yoga_version
    ss.dependency             'YogaKit', yogakit_version
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files  = 'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/StatoKitLayoutPlugin.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKTapListener.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKInvalidation.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKDescriptorMapper.h'
    ss.private_header_files = 'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKTouch.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKNodeDescriptor.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKNamed.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKObject.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/SKHighlightOverlay.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/UIColor+SKSonarValueCoder.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/utils/SKObjectHash.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/utils/SKSwizzle.h',
                              'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/utils/SKYogaKitHelper.h'
    ss.source_files         = 'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutPlugin/**/*.{h,cpp,m,mm}'
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatoKit/**" }
  end

  spec.subspec "StatoKitLayoutComponentKitSupport" do |ss|
    ss.header_dir = "StatoKitLayoutComponentKitSupport"
    ss.dependency             'StatoKit/Core'
    ss.dependency             'Yoga', yoga_version
    ss.dependency             'ComponentKit'
    ss.dependency             'StatoKit/StatoKitLayoutPlugin'
    ss.compiler_flags       = folly_compiler_flags
    ss.dependency             'StatoKit/StatoKitLayoutPlugin'
    ss.public_header_files = 'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutComponentKitSupport/StatoKitLayoutComponentKitSupport.h',
                             'iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutComponentKitSupport/SKSubDescriptor.h'
    ss.source_files         = "iOS/Plugins/StatoKitLayoutPlugin/StatoKitLayoutComponentKitSupport/**/*.{h,cpp,m,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatoKit/**" }
  end

  spec.subspec "StatoKitNetworkPlugin" do |ss|
    ss.header_dir = "StatoKitNetworkPlugin"
    ss.dependency             'StatoKit/Core'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKBufferingPlugin.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKNetworkReporter.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKRequestInfo.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/SKResponseInfo.h',
                             'iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/StatoKitNetworkPlugin.h'
    ss.source_files         = "iOS/Plugins/StatoKitNetworkPlugin/StatoKitNetworkPlugin/*.{h,cpp,m,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatoKit/**" }
  end

  spec.subspec "SKIOSNetworkPlugin" do |ss|
    ss.header_dir = "SKIOSNetworkPlugin"
    ss.dependency 'StatoKit/Core'
    ss.dependency 'StatoKit/StatoKitNetworkPlugin'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatoKitNetworkPlugin/SKIOSNetworkPlugin/SKIOSNetworkAdapter.h'
    ss.source_files         = "iOS/Plugins/StatoKitNetworkPlugin/SKIOSNetworkPlugin/**/*.{h,cpp,m,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatoKit/**" }
  end

  spec.subspec "StatoKitUserDefaultsPlugin" do |ss|
    ss.header_dir = "StatoKitUserDefaultsPlugin"
    ss.dependency 'StatoKit/Core'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatoKitUserDefaultsPlugin/FKUserDefaultsPlugin.h'
    ss.source_files         = "iOS/Plugins/StatoKitUserDefaultsPlugin/**/*.{h,m}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatoKit/**" }
  end

  spec.subspec "StatoKitExamplePlugin" do |ss|
    ss.header_dir = "StatoKitExamplePlugin"
    ss.dependency 'StatoKit/Core'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatoKitExamplePlugin/StatoKitExamplePlugin.h'
    ss.source_files         = "iOS/Plugins/StatoKitExamplePlugin/**/*.{h,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatoKit/**" }
  end
end

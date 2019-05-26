folly_compiler_flags = '-DSTATES_OSS=1 -DFB_SONARKIT_ENABLED=1 -DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_HAVE_LIBGFLAGS=0 -DFOLLY_HAVE_LIBJEMALLOC=0 -DFOLLY_HAVE_PREADV=0 -DFOLLY_HAVE_PWRITEV=0 -DFOLLY_HAVE_TFO=0 -DFOLLY_USE_SYMBOLIZER=0'
yoga_version = '~> 1.9'
yogakit_version = '~>1.10'
stateskit_version = '0.16.2'
Pod::Spec.new do |spec|
  spec.name = 'StatesKit'
  spec.version = stateskit_version
  spec.license = { :type => 'MIT' }
  spec.homepage = 'https://github.com/facebook/Sonar'
  spec.summary = 'Sonar iOS podspec'
  spec.authors = 'Facebook'
  spec.static_framework = true
  spec.source = { :git => 'https://github.com/facebook/Sonar.git',
                  :tag=> "v"+stateskit_version }
  spec.module_name = 'StatesKit'
  spec.platforms = { :ios => "8.4" }
  spec.default_subspecs = "Core"

  # This subspec is necessary since FBDefines.h is imported as <FBDefines/FBDefines.h>
  # inside SKMacros.h, which is a public header file. Defining this directory as a
  # subspec with header_dir = 'FBDefines' allows this to work, even though it wouldn't
  # generally (you would need to import <StatesKit/t/FBDefines/FBDefines.h>)
  spec.subspec 'FBDefines' do |ss|
    ss.header_dir = 'FBDefines'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/FBDefines/**/*.h'
    ss.public_header_files = 'iOS/FBDefines/**/*.h'
  end

  spec.subspec 'CppBridge' do |ss|
    ss.header_dir = 'CppBridge'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatesKit/CppBridge/**/*.{h,mm}'
    # We set these files as private headers since they only need to be accessed
    # by other StatesKit source files
    ss.private_header_files = 'iOS/StatesKit/CppBridge/**/*.h'
    ss.preserve_path = 'StatesKit/CppBridge/**/*.h'
  end

  spec.subspec 'FBCxxUtils' do |ss|
    ss.header_dir = 'FBCxxUtils'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatesKit/FBCxxUtils/**/*.{h,mm}'
    # We set these files as private headers since they only need to be accessed
    # by other StatesKit source files
    ss.private_header_files = 'iOS/StatesKit/FBCxxUtils/**/*.h'
  end

  spec.subspec "FKPortForwarding" do |ss|
    ss.header_dir = "FKPortForwarding"
    ss.dependency 'CocoaAsyncSocket', '~> 7.6'
    ss.dependency 'PeerTalk', '~>0.0.2'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatesKit/FKPortForwarding/FKPortForwarding{Server,Common}.{h,m}'
    ss.private_header_files = 'iOS/StatesKit/FKPortForwarding/FKPortForwarding{Server,Common}.h'
  end


  spec.subspec "Core" do |ss|
    ss.dependency 'StatesKit/FBDefines'
    ss.dependency 'StatesKit/FBCxxUtils'
    ss.dependency 'StatesKit/CppBridge'
    ss.dependency 'StatesKit/FKPortForwarding'
    ss.dependency 'Folly', '~>1.2'
    ss.dependency 'States', '~>'+stateskit_version
    ss.dependency 'OpenSSL-Static', '1.0.2.c1'
    ss.compiler_flags = folly_compiler_flags
    ss.source_files = 'iOS/StatesKit/FBDefines/*.{h,cpp,m,mm}', 'iOS/StatesKit/CppBridge/*.{h,mm}', 'iOS/StatesKit/FBCxxUtils/*.{h,mm}', 'iOS/StatesKit/*.{h,m,mm}'
    ss.public_header_files = 'iOS/Plugins/StatesKitNetworkPlugin/SKIOSNetworkPlugin/SKIOSNetworkAdapter.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKBufferingPlugin.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKNetworkReporter.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKRequestInfo.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKResponseInfo.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/StatesKitNetworkPlugin.h',
                             'iOS/Plugins/StatesKitUserDefaultsPlugin/FKUserDefaultsPlugin.h',
                             'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/StatesKitLayoutPlugin.h',
                             'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKTapListener.h',
                             'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKInvalidation.h',
                             'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKDescriptorMapper.h',
                             'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutComponentKitSupport/StatesKitLayoutComponentKitSupport.h',
                             'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutComponentKitSupport/SKSubDescriptor.h',
                             'iOS/FBDefines/FBDefines.h',
                             'iOS/Plugins/StatesKitExamplePlugin/StatesKitExamplePlugin/StatesKitExamplePlugin.h',
                             'iOS/Plugins/StatesKitCrashReporterPlugin/StatesKitCrashReporterPlugin/StatesKitCrashReporterPlugin.h',
                             'iOS/StatesKit/**/{StatesDiagnosticsViewController,StatesStateUpdateListener,StatesClient,StatesPlugin,StatesConnection,StatesResponder,SKMacros}.h'
    header_search_paths = "\"$(PODS_ROOT)/StatesKit/iOS/StatesKit\" \"$(PODS_ROOT)\"/Headers/Private/StatesKit/** \"$(PODS_ROOT)/boost-for-react-native\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/PeerTalkSonar\""
    ss.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                             "DEFINES_MODULE" => "YES",
                             "HEADER_SEARCH_PATHS" => header_search_paths }
  end

  spec.subspec "StatesKitLayoutPlugin" do |ss|
    ss.header_dir = "StatesKitLayoutPlugin"
    ss.dependency             'StatesKit/Core'
    ss.dependency             'Yoga', yoga_version
    ss.dependency             'YogaKit', yogakit_version
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files  = 'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/StatesKitLayoutPlugin.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKTapListener.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKInvalidation.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKDescriptorMapper.h'
    ss.private_header_files = 'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKTouch.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKNodeDescriptor.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKNamed.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKObject.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/SKHighlightOverlay.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/UIColor+SKSonarValueCoder.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/utils/SKObjectHash.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/utils/SKSwizzle.h',
                              'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/utils/SKYogaKitHelper.h'
    ss.source_files         = 'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutPlugin/**/*.{h,cpp,m,mm}'
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatesKit/**" }
  end

  spec.subspec "StatesKitLayoutComponentKitSupport" do |ss|
    ss.header_dir = "StatesKitLayoutComponentKitSupport"
    ss.dependency             'StatesKit/Core'
    ss.dependency             'Yoga', yoga_version
    ss.dependency             'ComponentKit'
    ss.dependency             'StatesKit/StatesKitLayoutPlugin'
    ss.compiler_flags       = folly_compiler_flags
    ss.dependency             'StatesKit/StatesKitLayoutPlugin'
    ss.public_header_files = 'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutComponentKitSupport/StatesKitLayoutComponentKitSupport.h',
                             'iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutComponentKitSupport/SKSubDescriptor.h'
    ss.source_files         = "iOS/Plugins/StatesKitLayoutPlugin/StatesKitLayoutComponentKitSupport/**/*.{h,cpp,m,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatesKit/**" }
  end

  spec.subspec "StatesKitNetworkPlugin" do |ss|
    ss.header_dir = "StatesKitNetworkPlugin"
    ss.dependency             'StatesKit/Core'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKBufferingPlugin.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKNetworkReporter.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKRequestInfo.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/SKResponseInfo.h',
                             'iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/StatesKitNetworkPlugin.h'
    ss.source_files         = "iOS/Plugins/StatesKitNetworkPlugin/StatesKitNetworkPlugin/*.{h,cpp,m,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatesKit/**" }
  end

  spec.subspec "SKIOSNetworkPlugin" do |ss|
    ss.header_dir = "SKIOSNetworkPlugin"
    ss.dependency 'StatesKit/Core'
    ss.dependency 'StatesKit/StatesKitNetworkPlugin'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatesKitNetworkPlugin/SKIOSNetworkPlugin/SKIOSNetworkAdapter.h'
    ss.source_files         = "iOS/Plugins/StatesKitNetworkPlugin/SKIOSNetworkPlugin/**/*.{h,cpp,m,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatesKit/**" }
  end

  spec.subspec "StatesKitUserDefaultsPlugin" do |ss|
    ss.header_dir = "StatesKitUserDefaultsPlugin"
    ss.dependency 'StatesKit/Core'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatesKitUserDefaultsPlugin/FKUserDefaultsPlugin.h'
    ss.source_files         = "iOS/Plugins/StatesKitUserDefaultsPlugin/**/*.{h,m}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatesKit/**" }
  end

  spec.subspec "StatesKitExamplePlugin" do |ss|
    ss.header_dir = "StatesKitExamplePlugin"
    ss.dependency 'StatesKit/Core'
    ss.compiler_flags       = folly_compiler_flags
    ss.public_header_files = 'iOS/Plugins/StatesKitExamplePlugin/StatesKitExamplePlugin.h'
    ss.source_files         = "iOS/Plugins/StatesKitExamplePlugin/**/*.{h,mm}"
    ss.pod_target_xcconfig = { "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)\"/Headers/Private/StatesKit/**" }
  end
end

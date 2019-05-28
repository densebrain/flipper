Pod::Spec.new do |spec|
  spec.name = 'StatoKit'
  spec.version = '0.11.1'
  spec.license = { :type => 'MIT' }
  spec.source = { :git => 'https://github.com/facebook/Sonar.git',
                  :tag=> "v0.11.1" }
  spec.homepage = 'https://github.com/facebook/stato'
  spec.source_files = 'README.md'
  spec.summary = 'StatoKit iOS podspec'
  spec.authors = 'Facebook'
  spec.static_framework = true
  spec.module_name = 'StatoKit'
  spec.platforms = { :ios => "8.4" }
end

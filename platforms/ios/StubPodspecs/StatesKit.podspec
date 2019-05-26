Pod::Spec.new do |spec|
  spec.name = 'StatesKit'
  spec.version = '0.11.1'
  spec.license = { :type => 'MIT' }
  spec.source = { :git => 'https://github.com/facebook/Sonar.git',
                  :tag=> "v0.11.1" }
  spec.homepage = 'https://github.com/facebook/states'
  spec.source_files = 'README.md'
  spec.summary = 'StatesKit iOS podspec'
  spec.authors = 'Facebook'
  spec.static_framework = true
  spec.module_name = 'StatesKit'
  spec.platforms = { :ios => "8.4" }
end

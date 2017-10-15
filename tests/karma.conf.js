// karma configuration
var karmaConf = {
  basePath: '../',
  browserify: {
    debug: true // ,
    // transform: [
    //   ['babelify', {presets: ['es2015']}]
    // ]
  },
  browsers: ['Chrome', 'Firefox'],
  // browsers: ['FirefoxNightly', 'Chromium_WebVR'],
  client: {
    captureConsole: true,
    mocha: {'ui': 'tdd'}
  },
  customLaunchers: {
    Chromium_WebVR: {
      base: 'Chromium',
      flags: ['--enable-webvr', '--enable-gamepad-extensions']
    }
  },
  envPreprocessor: [
    'TEST_ENV'
  ],
  files: [
    // dependencies
    {pattern: 'tests/testDependencies.js', included: true},
    // module
    {pattern: 'index.js', included: true},
    // Define test files.
    {pattern: 'tests/**/*.test.js'}
    // Serve test assets.
    // {pattern: 'tests/assets/**/*', included: false, served: true}
  ],
  frameworks: ['mocha', 'sinon-chai', 'browserify'],
  preprocessors: {
    'tests/testDependencies.js': ['browserify'],
    'index.js': ['browserify'],
    'tests/**/*.js': ['browserify']
  },
  reporters: ['mocha']
}

// Apply configuration
module.exports = function (config) {
  config.set(karmaConf)
}

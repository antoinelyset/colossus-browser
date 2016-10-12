var Jshint = require('broccoli-jshint');
var Babel = require('broccoli-babel-transpiler');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var Rollup = require('broccoli-rollup');
var nodeResolveRollup = require('rollup-plugin-node-resolve');
var commonjsRollup = require('rollup-plugin-commonjs');

var hintedColossus = new Jshint('src', {disableTestGenerator: true});
var colossus = new Babel('src', {
  presets: ['es2015-native-modules']
});
var faye = new Funnel('node_modules/faye', {
  destDir: 'node_modules/faye'
});

var src = mergeTrees([faye, hintedColossus, colossus]);

module.exports = new Rollup(src, {
  rollup: {
    entry: 'colossus',
    plugins: [
      nodeResolveRollup({
        browser: true,
        main: true
      }),
      commonjsRollup()
    ],
    targets: [{
      dest: 'colossus.js',
      moduleName: 'Colossus',
      format: 'umd'
    }]
  }
});

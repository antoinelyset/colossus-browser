var broccoli    = require("broccoli");
var pickFiles   = require("broccoli-static-compiler");
var jshint      = require('broccoli-jshint');
var mergeTrees  = require("broccoli-merge-trees");
var concat      = require("broccoli-concat");
var reactFilter = require("./broccoli_filters/react");
var uglifyJavaScript = require('broccoli-uglify-js');

var src      = "src";
var colossus = pickFiles(src, {
  srcDir: "/",
  files: ["*.js"],
  destDir: "/"
});

colossus       = reactFilter(colossus, {harmony: true, stripTypes: true});
hintedColossus = jshint(colossus, {disableTestGenerator: true});
src            = mergeTrees(["src/wrapper", colossus, "node_modules", hintedColossus]);
src            = concat(src, {
  inputFiles: [
    "faye/browser/faye-browser.js",
    "header.js",
    "colossus.js",
    "footer.js"
  ],
  outputFile: "/colossus.js"
});

//src = uglifyJavaScript(src);
module.exports = src;

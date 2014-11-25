'use strict';

var Filter = require('broccoli-filter');
var reactTransform = require('react-tools').transform;

function reactFilter (inputTree, options) {
  if (!(this instanceof reactFilter)){
    return new reactFilter(inputTree, options);
  }
  this.inputTree = inputTree;

  this.options = options || {};
  if (this.options.extensions) {
    this.extensions = options.extensions;
  }
  if (this.options.harmony) {
    this.harmony    = options.harmony;
  }
  if (this.options.stripTypes) {
    this.stripTypes = options.stripTypes;
  }
  if (this.options.sourceMapInline) {
    this.sourceMapInline = options.sourceMapInline;
  }
}

reactFilter.prototype = Object.create(Filter.prototype);
reactFilter.prototype.constructor = reactFilter;
reactFilter.prototype.extensions = ['js'];
reactFilter.prototype.targetExtension = 'js';

reactFilter.prototype.processString = function (string) {
  var options = {
    harmony: this.options.harmony,
    sourceMap: this.options.sourceMapInline,
    stripTypes: this.options.stripTypes
  };
  return reactTransform(string, options);
};

module.exports = reactFilter;

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else {
    // Browser globals
    root.Colossus = factory();
  }
}(this, function () {
  var root = this;

  var previousModule = root.module;
  root.module        = undefined;

  var previousFaye   = root.Faye;
  var Faye           = root.Faye;

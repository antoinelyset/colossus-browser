(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['faye/browser/faye-browser'], factory);
  } else {
    // Browser globals
    root.Colossus = factory(root.Faye);
  }
}(this, function (Faye) {

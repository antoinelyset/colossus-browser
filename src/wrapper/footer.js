
  Colossus.noConflict = function() {
    root.Faye   = previousFaye;
    root.module = previousModule;
    return this;
  };

  root.module = previousModule;
  root.Faye   = previousFaye;

  return Colossus;
}));


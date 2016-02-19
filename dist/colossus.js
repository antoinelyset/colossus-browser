(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['faye/browser/faye-browser'], factory);
  } else {
    // Browser globals
    root.Colossus = factory(root.Faye);
  }
}(this, function (Faye) {

// @flow
                      
var Colossus = function(url        , userId        , userToken        ) {
  this.heartbeatInterval = Colossus.HEARTBEAT_INTERVAL; // Milliseconds
  this.awayTimeout       = Colossus.AWAY_TIMEOUT; //Seconds
  this.awayInterval      = Colossus.AWAY_INTERVAL; //Milliseconds
  this.awaySeconds        = 0;
  this.status             = "active";
  this.previousStatus     = "disconnected";

  this.userId    = userId;
  this.userToken = userToken;
  this.url       = url;
  this.userUrl   = ("/users/" + this.userId);

  this.fayeClient = new Faye.Client(this.url);
  this.fayeClient.disable("autodisconnect");
  this.fayeClient.addExtension({
    outgoing: function(message, callback)  {
      message.ext = message.ext || {};
      message.ext.user_token = this.userToken;// jshint ignore:line
      return callback(message);
    }.bind(this)
  });

  document.addEventListener("click",     function()  { this.awaySeconds = 0; }.bind(this));
  document.addEventListener("mousemove", function()  { this.awaySeconds = 0; }.bind(this));
  document.addEventListener("keypress",  function()  { this.awaySeconds = 0; }.bind(this));

  window.addEventListener("beforeunload", function()  { this.disconnect(); }.bind(this));

  this.fayeClient.on("transport:down", function()  {
    this.emit("statusChanged", "disconnected");
  }.bind(this));

  this.fayeClient.on("transport:up", function()  {
    this.emit("statusChanged", "connected");
  }.bind(this));

  var subscription = this.fayeClient.subscribe(this.userUrl, function(message)  {
    this.emit("message", message);
  }.bind(this));

  subscription.then(function()  {
    this.publishStatus(this.status).then(function()  { this.heartbeat(); }.bind(this));

    this.on('statusChanged', function()  {
      this.publishStatus(this.status).then(function()  { this.heartbeat(); }.bind(this));
    }.bind(this));
    this.awayChecker();
  }.bind(this));
};

Colossus.prototype.heartbeat = function() {
  clearTimeout(this.heartbeatTimer);
  this.heartbeatTimer = setTimeout(function()  {
    this.publishStatus(this.status).then(function()  { this.heartbeat(); }.bind(this));
  }.bind(this), this.heartbeatInterval);
};

Colossus.prototype.awayChecker = function() {
  clearTimeout(this.awayTimer);
  this.awayTimer = setTimeout(function()  {
    this.awaySeconds = this.awaySeconds + 1;
    if (this.awaySeconds >= this.awayTimeout) {
      this.status = "away";
    } else {
      this.status = "active";
    }
    if (this.previousStatus !== this.status) { this.emit("statusChanged", this.status); }
    this.previousStatus = this.status;
    this.awayChecker();
  }.bind(this), this.awayInterval);
};

Colossus.prototype.publishStatus = function(givenStatus        ) {
  return this.fayeClient.publish(this.userUrl, {status: givenStatus});
};

Colossus.prototype.disconnect = function() {
  if (this.heartbeatTimer) {
    clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }
  this.publishStatus("disconnected").then(function()  {
    this.fayeClient.disconnect();
    this.emit("statusChanged", "disconnected");
  }.bind(this), function()  {
    this.fayeClient.disconnect();
    this.emit("statusChanged", "disconnected");
  }.bind(this));
};

Colossus.VERSION            = "0.8.1";
Colossus.HEARTBEAT_INTERVAL = 2000; // Milliseconds
Colossus.AWAY_TIMEOUT       = 30; //Seconds
Colossus.AWAY_INTERVAL      = 1000; //Milliseconds

Faye.extend(Colossus.prototype, Faye.EventEmitter.prototype);

  return Colossus;
}));

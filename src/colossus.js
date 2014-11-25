// @flow
declare var Faye: any;
declare var EventEmitter: any;
var Colossus = function(url: string, userId: string, userToken: string) {
  this.VERSION           = "0.0.0";
  this.heartbeatInterval = 2000;

  this.userId    = userId;
  this.userToken = userToken;
  this.url       = url;
  this.userUrl   = `/users/${this.userId}`;

  this.fayeClient = new Faye.Client(this.url);
  this.fayeClient.disable("autodisconnect");
  this.fayeClient.addExtension({
    outgoing: (message, callback) => {
      message.ext = message.ext || {};
      message.ext.user_token = this.userToken;// jshint ignore:line
      return callback(message);
    }
  });

  window.addEventListener("beforeunload", () => { this.disconnect(); });
  this.heartbeat();

  this.fayeClient.subscribe(this.userUrl, (message) => {
    if(!this.messageCallback){ return; }
    message = JSON.parse(message);
    this.messageCallback.apply(this, [message]);
  });
};

Colossus.prototype.heartbeat = function() {
  clearTimeout(this.heartbeatTimer);
  this.heartbeatTimer = setTimeout(() => {
    this.publishStatus("active").then(() => { this.heartbeat(); });
  }, this.heartbeatInterval);
};

Colossus.prototype.publishStatus = function(givenStatus: string) {
  return this.fayeClient.publish(this.userUrl, {status: givenStatus});
};

Colossus.prototype.disconnect = function() {
  if (this.heartbeatTimer) {
    clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }
  this.publishStatus("disconnected").then(() => {
    this.fayeClient.disconnect();
  }, () => {
    this.fayeClient.disconnect();
  });
};

Colossus.prototype.onMessage = function(callback) {
  this.messageCallback = callback;
};

Colossus.prototype.unbindMessage = function() {
  this.messageCallback = null;
};

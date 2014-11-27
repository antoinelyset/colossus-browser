// @flow
declare var Faye: any;
var Colossus = function(url: string, userId: string, userToken: string) {
  this.VERSION            = "0.0.0";
  this.HEARTBEAT_INTERVAL = 2000; // Milliseconds
  this.AWAY_TIMEOUT       = 30; //Seconds
  this.AWAY_INTERVAL      = 1000; //Milliseconds
  this.awaySeconds        = 0;
  this.status             = "active";
  this.previousStatus     = "disconnected";

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

  document.addEventListener("click",     () => { this.awaySeconds = 0; });
  document.addEventListener("mousemove", () => { this.awaySeconds = 0; });
  document.addEventListener("keypress",  () => { this.awaySeconds = 0; });

  window.addEventListener("beforeunload", () => { this.disconnect(); });

  this.heartbeat();
  this.awayChecker();

  this.fayeClient.subscribe(this.userUrl, (message) => {
    this.emit("message", message);
  });
};

Colossus.prototype.heartbeat = function() {
  clearTimeout(this.heartbeatTimer);
  this.heartbeatTimer = setTimeout(() => {
    this.publishStatus(this.status).then(() => { this.heartbeat(); });
  }, this.HEARTBEAT_INTERVAL);
};

Colossus.prototype.awayChecker = function() {
  clearTimeout(this.awayTimer);
  this.awayTimer = setTimeout(() => {
    this.awaySeconds = this.awaySeconds + 1;
    if (this.awaySeconds >= this.AWAY_TIMEOUT) {
      this.status = "away";
    } else {
      this.status = "active";
    }
    if (this.previousStatus !== this.status) { this.emit("statusChanged", this.status); }
    this.previousStatus = this.status;
    this.awayChecker();
  }, this.AWAY_INTERVAL);
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
    this.emit("statusChanged", "disconnected");
  }, () => {
    this.fayeClient.disconnect();
    this.emit("statusChanged", "disconnected");
  });
};

Faye.extend(Colossus.prototype, Faye.EventEmitter.prototype);

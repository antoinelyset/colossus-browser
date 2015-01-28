// @flow
declare var Faye: any;
var Colossus = function(url: string, userId: string, userToken: string) {
  this.heartbeatInterval = Colossus.HEARTBEAT_INTERVAL; // Milliseconds
  this.awayTimeout       = Colossus.AWAY_TIMEOUT; //Seconds
  this.awayInterval      = Colossus.AWAY_INTERVAL; //Milliseconds
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

  this.fayeClient.on("transport:down", () => {
    this.emit("statusChanged", "disconnected");
  });

  this.fayeClient.on("transport:up", () => {
    this.emit("statusChanged", "connected");
  });

  var subscription = this.fayeClient.subscribe(this.userUrl, (message) => {
    this.emit("message", message);
  });

  subscription.then(() => {
    this.heartbeat();
    this.awayChecker();
  });
};

Colossus.prototype.heartbeat = function() {
  clearTimeout(this.heartbeatTimer);
  this.heartbeatTimer = setTimeout(() => {
    this.publishStatus(this.status).then(() => { this.heartbeat(); });
  }, this.heartbeatInterval);
};

Colossus.prototype.awayChecker = function() {
  clearTimeout(this.awayTimer);
  this.awayTimer = setTimeout(() => {
    this.awaySeconds = this.awaySeconds + 1;
    if (this.awaySeconds >= this.awayTimeout) {
      this.status = "away";
    } else {
      this.status = "active";
    }
    if (this.previousStatus !== this.status) { this.emit("statusChanged", this.status); }
    this.previousStatus = this.status;
    this.awayChecker();
  }, this.awayInterval);
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

Colossus.VERSION            = "0.2.0";
Colossus.HEARTBEAT_INTERVAL = 2000; // Milliseconds
Colossus.AWAY_TIMEOUT       = 30; //Seconds
Colossus.AWAY_INTERVAL      = 1000; //Milliseconds

Faye.extend(Colossus.prototype, Faye.EventEmitter.prototype);

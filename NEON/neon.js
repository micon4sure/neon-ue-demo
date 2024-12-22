// index.ts
var NEON;
(function(NEON) {
  let loggingEnabled = true;
  function setLoggingEnabled(enabled) {
    console.log("NEON logging set to ", enabled ? "enabled" : "disabled");
    loggingEnabled = enabled;
  }
  NEON.setLoggingEnabled = setLoggingEnabled;
  function log(...args) {
    if (loggingEnabled) {
      console.log(...args);
    }
  }
  NEON.log = log;
  function error(...args) {
    if (loggingEnabled) {
      console.error(...args);
    }
  }
  NEON.error = error;
  function InvokeUnrealEvent(delegate, data = {}) {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }
  NEON.InvokeUnrealEvent = InvokeUnrealEvent;
  NEON.InvokeUnreal = InvokeUnrealEvent;
  function InvokeUnrealFunction(delegate, data = {}) {
    return NEON_Bridge_Unreal.invokeUnrealFunction(delegate, data);
  }
  NEON.InvokeUnrealFunction = InvokeUnrealFunction;
  function OnInvoke(delegate, callback) {
    NEON_Bridge_Web.registerCallback(delegate, callback);
  }
  NEON.OnInvoke = OnInvoke;
  NEON.OnInvokeWeb = OnInvoke;
  function InvokeWeb(delegate, data) {
    NEON_Bridge_Web.invoke(delegate, data);
  }
  NEON.InvokeWeb = InvokeWeb;
})(NEON || (NEON = {}));
window.NEON_Bridge_Web_Invoke = (method, data) => {
  NEON_Bridge_Web.invoke(method, data);
};

class NEON_Bridge_Web {
  static callbacks = {};
  static registerCallback(id, callback) {
    NEON.log("Registering NEON callback", id);
    NEON_Bridge_Web.callbacks[id] = callback;
  }
  static invoke(id, dataRaw = "{}") {
    let data;
    try {
      data = JSON.parse(dataRaw);
    } catch (e) {
      NEON.error("Invoke NEON web callback failed: data is not JSON parseable: ", data);
      return;
    }
    if (!NEON_Bridge_Web.callbacks[id]) {
      NEON.error(`Invoke NEON web callback failed: callback not found: ${id}`);
      return;
    }
    NEON.log("Invoke NEON web callback", id, data);
    NEON_Bridge_Web.callbacks[id](data);
  }
}

class NEON_Bridge_Unreal {
  static invokeUnreal(delegate, data) {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }
  static invokeUnrealFunction(delegate, data) {
    if (!delegate) {
      NEON.error("NEON.invokeUnrealFunction failed: delegate is required");
      return Promise.reject({ errorCode: 101, errorMessage: "Delegate is required" });
    }
    delegate = "Invoke_" + delegate;
    NEON.log("NEON.invokeUnrealFunction", delegate, data);
    return new Promise((resolve, reject) => {
      if (!window.cefQuery) {
        NEON.error("NEON.invokeUnrealFunction failed: cefQuery is not defined");
        return reject({ errorCode: 103, errorMessage: "cefQuery is not defined" });
      }
      window.cefQuery({
        request: JSON.stringify({
          type: "function",
          delegate,
          parameters: data
        }),
        onSuccess: function(response) {
          NEON.log(`NEON.invokeUnrealFunction[${delegate}] succeeded: ${response}`);
          try {
            const result = JSON.parse(response);
            resolve(result);
          } catch (e) {
            NEON.error(`NEON.invokeUnrealFunction[${delegate}] failed to parse response: ${response}`);
            reject({ errorCode: 102, errorMessage: "Failed to parse response" });
          }
        },
        onFailure: function(errorCode, errorMessage) {
          NEON.error(`NEON.invokeUnrealFunction[${delegate}] failed: ${errorCode} - ${errorMessage}`);
          reject({ errorCode, errorMessage });
        }
      });
    });
  }
  static invokeUnrealEvent(delegate, data = {}) {
    if (!delegate) {
      NEON.error("NEON.invokeUnrealFunction failed: delegate is required");
      return Promise.reject({ errorCode: 101, errorMessage: "Delegate is required" });
    }
    delegate = "OnInvoke_" + delegate;
    NEON.log("NEON.invokeUnrealEvent", delegate, data);
    return new Promise((resolve, reject) => {
      if (!window.cefQuery) {
        NEON.error("NEON.invokeUnrealFunction failed: cefQuery is not defined");
        return reject({ errorCode: 103, errorMessage: "cefQuery is not defined" });
      }
      window.cefQuery({
        request: JSON.stringify({
          type: "event",
          delegate,
          parameters: data
        }),
        onSuccess: function(response) {
          NEON.log(`NEON.invokeUnrealEvent[${delegate}] succeeded.`);
          resolve(null);
        },
        onFailure: function(errorCode, errorMessage) {
          NEON.error(`NEON.invokeUnrealEvent failed: ${errorCode} - ${errorMessage}`);
          reject({ errorCode, errorMessage });
        }
      });
    });
  }
}
var NEON_web_default = NEON;
export {
  NEON_web_default as default
};

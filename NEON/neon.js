// index.ts
var NEON;
(function(NEON) {
  function invokeUnrealEvent(delegate, data = {}) {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }
  NEON.invokeUnrealEvent = invokeUnrealEvent;
  NEON.invokeUnreal = invokeUnrealEvent;
  function invokeUnrealFunction(delegate, data = {}) {
    return NEON_Bridge_Unreal.invokeUnrealFunction(delegate, data);
  }
  NEON.invokeUnrealFunction = invokeUnrealFunction;
  function onInvoke(delegate, callback) {
    NEON_Bridge_Web.registerCallback(delegate, callback);
  }
  NEON.onInvoke = onInvoke;
  function invoke(delegate, data) {
    NEON_Bridge_Web.invoke(delegate, data);
  }
  NEON.invoke = invoke;
  function setVerbose(verbose) {
    Log.setVerbose(verbose);
  }
  NEON.setVerbose = setVerbose;
})(NEON || (NEON = {}));

class Log {
  static verbose = false;
  static setVerbose(verbose) {
    Log.verbose = verbose;
  }
  static info(...args) {
    if (!Log.verbose)
      return;
    console.log(`[NEON]`, ...args);
  }
  static error(...args) {
    console.error(`[NEON]`, ...args);
  }
}

class NEON_Bridge_Web {
  static callbacks = {};
  static registerCallback(id, callback) {
    Log.info("Registering NEON callback", id);
    NEON_Bridge_Web.callbacks[id] = callback;
  }
  static invoke(id, dataRaw = "{}") {
    let data;
    try {
      data = JSON.parse(dataRaw);
    } catch (e) {
      Log.error("Invoke NEON web callback failed: data is not JSON parseable: ", dataRaw);
      return;
    }
    if (!NEON_Bridge_Web.callbacks[id]) {
      Log.error(`Invoke NEON web callback failed: callback not found: ${id}`);
      return;
    }
    Log.info("Invoke NEON web callback", id, data);
    NEON_Bridge_Web.callbacks[id](data);
  }
}

class NEON_Bridge_Unreal {
  static invokeUnreal(delegate, data) {
    return NEON_Bridge_Unreal.invokeUnrealEvent(delegate, data);
  }
  static invokeUnrealFunction(delegate, data) {
    if (!delegate) {
      Log.error("NEON.invokeUnrealFunction failed: delegate is required");
      return Promise.reject({ errorCode: 101, errorMessage: "Delegate is required" });
    }
    delegate = "Invoke_" + delegate;
    Log.info("NEON.invokeUnrealFunction", delegate, data);
    return new Promise((resolve, reject) => {
      if (!window.cefQuery) {
        Log.error("NEON.invokeUnrealFunction failed: cefQuery is not defined");
        return reject({ errorCode: 103, errorMessage: "cefQuery is not defined" });
      }
      window.cefQuery({
        request: JSON.stringify({
          type: "function",
          delegate,
          parameters: data
        }),
        onSuccess: function(response) {
          Log.info(`NEON.invokeUnrealFunction[${delegate}] succeeded: ${response}`);
          try {
            const result = JSON.parse(response);
            resolve(result);
          } catch (e) {
            Log.error(`NEON.invokeUnrealFunction[${delegate}] failed to parse response: ${response}`);
            reject({ errorCode: 102, errorMessage: "Failed to parse response" });
          }
        },
        onFailure: function(errorCode, errorMessage) {
          Log.error(`NEON.invokeUnrealFunction[${delegate}] failed: ${errorCode} - ${errorMessage}`);
          reject({ errorCode, errorMessage });
        }
      });
    });
  }
  static invokeUnrealEvent(delegate, data = {}) {
    if (!delegate) {
      Log.error("NEON.invokeUnrealFunction failed: delegate is required");
      return Promise.reject({ errorCode: 101, errorMessage: "Delegate is required" });
    }
    delegate = "OnInvoke_" + delegate;
    Log.info("NEON.invokeUnrealEvent", delegate, data);
    return new Promise((resolve, reject) => {
      if (!window.cefQuery) {
        Log.error("NEON.invokeUnrealFunction failed: cefQuery is not defined");
        return reject({ errorCode: 103, errorMessage: "cefQuery is not defined" });
      }
      window.cefQuery({
        request: JSON.stringify({
          type: "event",
          delegate,
          parameters: data
        }),
        onSuccess: function(response) {
          Log.info(`NEON.invokeUnrealEvent[${delegate}] succeeded.`);
          resolve(null);
        },
        onFailure: function(errorCode, errorMessage) {
          Log.error(`NEON.invokeUnrealEvent[${delegate}] failed: ${errorCode} - ${errorMessage}`);
          reject({ errorCode, errorMessage });
        }
      });
    });
  }
}
window.NEON_Bridge_Web_Invoke = NEON.invoke;
var neon_ue_web_default = NEON;
export {
  neon_ue_web_default as default,
  NEON_Bridge_Web
};

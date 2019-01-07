(() => {
  const bindFn = ($container, key, obj) => {
    let fn = (typeof obj === "object") ? obj.fn :
      ((typeof obj === "string") ? () => ORG.route(obj) : obj);
    $container.on("keydown", obj.delegate, key, (ev) => fn(ev) && false);
  };

  $.fn.orgKeyboard = function(keys, keepOldBindings) {
    !keepOldBindings && this.off();
    keys["alt+x"] = "#";
    Object.keys(keys).map((key) => {
      let obj = keys[key];
      (obj.constructor === Array) ? obj.map((val) => bindFn(this, key, val)) : bindFn(this, key, obj);
    });
    return this;
  };
})();

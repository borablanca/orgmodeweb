(() => {
  const bindFn = ($container, key, obj) => {
    const fn = typeof obj === "object" ? obj.fn :
      typeof obj === "string" ? () => ORG.route(obj) : obj;
    $container.on("keydown", obj.delegate, key, (ev) => fn(ev) && false);
  };

  const cursorFn = (nextFn) => {
    const $cursor = $("#cursor");
    const $next = nextFn($cursor);

    if ($next[0]) {
      $cursor.removeAttr("id");
      if (!$next.attr("id", "cursor").isInViewport()) {
        $next.scrollTo();
      }
    }
    return false;
  };

  ORG.Keyboard = {
    "bind": function (keys) {
      if (ORG.Utils.isMobile) return false;
      const $container = $(document).off();
      keys["alt+x"] = "#";
      Object.keys(keys).forEach((key) => {
        const bindingFn = keys[key];

        if (bindingFn.constructor === Array) {
          bindingFn.map((binding) => bindFn($container, key, binding));
        } else {
          bindFn($container, key, bindingFn);
        }
      });
      return true;
    },
    "common": {
      "cursorUp": () => cursorFn(
        ($c) => $c.prevAll(":visible").first()
      ),
      "cursorDown": () => cursorFn(
        ($c) => $c.nextAll(":visible").first()
      ),
      "cursorBackward": () => cursorFn(
        ($c) => $c.prevAll(`[data-lvl=${$c.data("lvl")}]:visible`).first()
      ),
      "cursorForward": () => cursorFn(
        ($c) => $c.nextAll(`[data-lvl=${$c.data("lvl")}]:visible`).first()
      ),
      "cursorFirst": () => cursorFn(
        ($c) => $c.prevAll(":visible").last()
      ),
      "cursorLast": () => cursorFn(
        ($c) => $c.nextAll(":visible").last()
      ),
      "cursorParent": () => cursorFn(
        ($c) => $c.prevAll(`[data-lvl=${$c.data("lvl") - 1}]:visible`).first()
      )
    }
  };
})();

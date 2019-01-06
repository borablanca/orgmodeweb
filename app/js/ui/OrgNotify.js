(() => {
  const init = ($container, opts) => {
    let removeFn = () => $container.off().remove();
    return $container.orgKeyboard({
      "esc": [() => removeFn() && opts.cancel && opts.cancel() && false, {
        delegate: "input",
        fn: () => removeFn() && false,
      }],
      "return": {
        delegate: "input",
        fn: () => opts.confirm() && removeFn() && false,
      },
    }).on("click", "*:not(input)", function() {
      if (this.classList.contains("done")) opts.confirm();
      else opts.cancel && opts.cancel();
      removeFn();
      return false;
    });
  };

  $.fn.orgNotify = function(opts) {
    this.find(".orgnotify").off().remove(); // remove previous notify if exists
    let notification = init($(document.createElement("div"))
      .addClass("orgnotify")
      .html((typeof opts === "object") ?
        `${opts.content ? "<span>" + opts.content + "</span>" : ""}
        ${opts.prompt ? "<input type='text' value='" + (opts.value || "") + "'/>" : ""}
        ${opts.confirm ? "<div><button class='done'>OK</button><button>CANCEL</button></div>" : ""}` :
        `<span>${opts || ""}</span>`
      ), opts).appendTo(this).find(opts.prompt ? "input" : ".done").focus().end();
    (!(opts.sticky || opts.confirm)) && setTimeout(() => notification.off().remove(), 3000);
    return this;
  };
})();

$.fn.orgNotify = function (plan) {
  const {icon, textIcon} = ORG.Icons;
  this.find(".orgnotify").off().remove(); // remove any previous notify on this orgpage
  const $notify = $(document.createElement("div")).addClass("orgnotify").append(
    `<div>
${plan.message ? `<div class="orgmessage">${plan.message}</div>` : ""}
${plan.items ? `<div class="orgnotifyitems${plan.grid ? " " + plan.grid : ""}">
${plan.items.map((item, idx) => textIcon(item.name, idx < 9 ? {"idx": idx + 1} : {})).join("")}
</div>` : ""}
${plan.prompt ? `${[...Array(plan.prompt).keys()].map((idx) => `
<input type="text" spellcheck="false" value="${plan["value" + idx] || ""}" placeholder="${plan["placeholder" + idx] || ""}"/>`
  ).join("")}` : ""}
${plan.confirm ? `<div class="grid">${icon("done")}${icon("close")}</div>` : ""}
</div >
</div > `
  );

  const removeFn = () => {
    $notify.off().fadeOut(150, () => $notify.remove() && plan.cb && plan.cb());
    if (plan.rebind) plan.rebind();
    return false;
  };

  if (plan.items) {
    $notify.on("click", ".orgicon", function () {
      const itemFn = plan.items[$(this).index()].fn;
      if ($.isFunction(itemFn)) itemFn();
      else ORG.route(itemFn);
      removeFn();
      return false;
    });
  }

  if (plan.rebind) {
    ORG.Keyboard.bind(Object.assign({// default bindings
      "esc": [
        () => removeFn() && plan.cancel && plan.cancel(),
        {
          "delegate": "input",
          "fn": () => removeFn() && plan.cancel && plan.cancel(),
        }
      ],
      "return": {
        "delegate": "input",
        "fn": () => {
          plan.confirm.apply(this, plan.prompt ? $notify.find("input").map((idx, el) => el.value).toArray() : null);
          return removeFn();
        },
      },
    }, plan.items ? [...Array(plan.items.length)].reduce((numBindings, item, idx) => { // item bindings
      numBindings[idx + 1] = () => {
        $notify.find(".orgnotifyitems>a").eq(idx).click();
        return removeFn();
      };
      return numBindings;
    }, {}) : {}));
  }

  $notify
    .on("click", function (ev) {
      if (ev.target === this) return removeFn();
      const $orgicon = $(ev.target).closest(".orgicon");

      if ($orgicon[0]) {
        if ($orgicon.is(".done")) {
          plan.confirm.apply(this, plan.prompt ? $notify.find("input").map((idx, inpt) => inpt.value).toArray() : null);
        } else if (plan.cancel) plan.cancel();
        removeFn();
      }
      return false;
    })
    .hide()
    .appendTo(this)
    .fadeIn(150);

  if (plan.prompt) {
    $notify.find("input[type=text]").eq(0).textFocus();
  } else {
    $notify.find(".orgicon.done a").eq(0).focus();
  }

  if (!(plan.sticky || plan.confirm || plan.items)) {
    setTimeout(removeFn, plan.duration || 2000);
  }
  return this;
};

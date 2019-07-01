(() => {
  const {icon, textIcon, ICONTYPE} = ORG.Icons;

  $.fn.orgNavbar = function (plan = {}) {
    return this.addClass("orgNavbar").append(
      Object.keys(plan)
        .map((name) => name === "title" ?
          `<h1 class="nowrap">${plan.title.type}</h1>` :
          (plan[name].type === ICONTYPE.ICON ? icon : textIcon)(
            name,
            plan[name].opts
          )
        ))
      .on("click", ".orgicon", function () {
        const fn = plan[this.classList[1]].fn;
        return fn ?
          $.isFunction(fn) ? fn() : ORG.route(fn) :
          false;
      });
  };
})();

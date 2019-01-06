(() => {
  const itemTmpl = (key, val) =>
    `<a href="#agenda#${key}">
      <span>${val[0].header || "Custom Agenda " + key}</span>
    </a>`;

  const init = ($container, customAgendas) => {
    let shortcuts = {
      a: "#agenda#a",
      m: () => $container.find(".match").click(),
      s: () => $container.find(".search").click(),
    };
    Object.keys(customAgendas).map((key) => shortcuts[key] = "#agenda#" + key);
    $(document).orgKeyboard(shortcuts);
    return $container.on("click", "button", function() {
      let isM = this.classList.contains("match");
      let $page = $container.closest(".orgpage");
      $page.orgNotify({
        content: isM ? "Match: " : "Search: ",
        prompt: true,
        confirm: () => ORG.route(`#search#${isM ? "m" : "s"}#` + $(".orgnotify input", $page).val()),
      });
      return false;
    });
  };

  $.fn.orgMenu = function(customAgendas) {
    return init(this.addClass("orgmenu").append(
      `<a href='#agenda#a'><span><u>A</u>genda</span></a>
      <button class="match"><span><u>M</u>atch</span></button>
      <button class="search"><span><u>S</u>earch</span></button>`,
      Object.keys(customAgendas).map((key) => key !== "a" ? itemTmpl(key, customAgendas[key]) : "")
    ), customAgendas);
  };
})();

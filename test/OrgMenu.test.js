QUnit.module("OrgMenu Tests", function(hooks) {
  hooks.before(function() {
    $("body").append("<div id='app' style='display:none;'></div>");
  });
  hooks.beforeEach(function() {
    $("#app").empty();
    localStorage.clear();
  });
  hooks.after(function() {
    $("#app").empty().remove();
    $(document).off();
    localStorage.clear();
  });

  QUnit.test("show empty menu", function(assert) {
    $("#app").orgMenu(ORG.Settings.getCustomAgendas());
    assert.dom("#app.orgmenu").exists();
  });
  QUnit.test("show Agenda, Match, Search as default", function(assert) {
    $("#app").orgMenu(ORG.Settings.getCustomAgendas());
    let agendaLink = $("#app.orgmenu a");
    assert.equal(agendaLink.length, 1);
    assert.equal(agendaLink[0].hash, "#agenda#a");
    let searchButtons = $("#app.orgmenu button");
    assert.equal(searchButtons.length, 2);
    assert.ok(searchButtons[0].classList.contains("match"));
    assert.ok(searchButtons[1].classList.contains("search"));
  });
  QUnit.test("show custom agendas in menu", function(assert) {
    ORG.Settings.setSettings({
      "custom-agenda-b": "--type agenda",
      "custom-agenda-c": "",
      "custom-agenda-a": "",
    });
    $("#app").orgMenu(ORG.Settings.getCustomAgendas());
    let agendaLinks = $("#app.orgmenu a");
    assert.equal(agendaLinks.length, 3);
    assert.equal(agendaLinks[1].hash, "#agenda#b");
    assert.equal(agendaLinks[2].hash, "#agenda#c");
  });
});

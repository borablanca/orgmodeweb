QUnit.module("OrgNavbar Tests", function(hooks) {
  hooks.before(function() {
    $("body").append("<div id='app' style='display:none;'></div>");
  });

  QUnit.test("show empty navbar", function(assert) {
    $("#app").orgNavbar();
    assert.dom("#app.orgnavbar").exists();
    assert.dom("#app.orgnavbar .orgicon.org").exists();
    assert.dom("#app.orgnavbar div > span").doesNotExist();
  });
  QUnit.test("show only title", function(assert) {
    $("#app").orgNavbar({title: "title"});
    assert.dom("#app.orgnavbar").exists();
    assert.dom("#app.orgnavbar .orgicon.org").exists();
    assert.equal($("#app.orgnavbar > span").length, 1);
    assert.equal($("#app.orgnavbar span i").length, 0);
    assert.dom("#app.orgnavbar > span").hasText("title");
  });
  QUnit.test("show menu with title with add", function(assert) {
    $("#app").orgNavbar({title: "title", add: function() { }});
    assert.dom("#app.orgnavbar").exists();
    assert.equal($("#app.orgnavbar > span").length, 1);
    assert.dom("#app.orgnavbar > span").hasText("title");
    assert.equal($("#app.orgnavbar .orgicon").length, 2);
    assert.dom("#app.orgnavbar .orgicon.org").exists();
    assert.dom("#app.orgnavbar .orgicon.add").exists();
  });
});

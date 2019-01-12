QUnit.module("OrgActionbar Tests", function(hooks) {
  hooks.before(function() {
    ORG.Store.setFile("file1", [{fileName: "file1"}, {lvl: 1, title: "title"}]);
    $("body").append("<div id='app' style='display:none;'></div>");
  });
  hooks.beforeEach(function() {
    $("#app").orgNotes("file1");
  });
  hooks.after(function() {
    $("#app").empty().off().remove();
  });

  QUnit.test("creates div with orgactionbar class with OrgNotes", function(assert) {
    assert.dom("div.orgactionbar").exists();
    assert.dom(".orgactionbar button").exists();
    assert.equal($(".orgactionbar button").length, 7);
  });

  QUnit.test("change todo state with actionbar button", function(assert) {
    let $todoBtn = $(".orgactionbar .todo");
    $todoBtn.click();
    $(".orgcontext button").eq(1).click();
    assert.equal($(".orgnotes li:first-child").data("node").todo, "TODO");
    $todoBtn.click();
    $(".orgcontext button").eq(2).click();
    assert.equal($(".orgnotes li:first-child").data("node").todo, "DONE");
  });

  QUnit.test("change pri state with actionbar button", function(assert) {
    let $priBtn = $(".orgactionbar .pri");
    $priBtn.click();
    $(".orgcontext button").eq(1).click();
    assert.equal($(".orgnotes li:first-child").data("node").pri, "A");
    $priBtn.click();
    $(".orgcontext button").eq(2).click();
    assert.equal($(".orgnotes li:first-child").data("node").pri, "B");
    $priBtn.click();
    $(".orgcontext button").eq(0).click();
    assert.equal($(".orgnotes li:first-child").data("node").pri, undefined);
  });
});

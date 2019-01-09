QUnit.module("OrgMenu Tests", function(hooks) {
  hooks.before(function() {
    ORG.Store.setFile("file1", [{fileName: "file1"}, {lvl: 1, title: "title"}]);
    let el = document.createElement("div");
    el.setAttribute("id", "app");
    el.style.display = "none";
    $("body").append(el);
  });
  hooks.beforeEach(function() {
    $("#app").orgNotes("file1");
  });
  hooks.after(function() {
    $("#app").empty().remove();
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
});

QUnit.module("OrgContext Tests", function(hooks) {
  hooks.before(function() {
    $("body").append("<div id='container' style='display:none;'></div>");
  });
  hooks.beforeEach(function() {
    $("#container").off().empty().append("<div class='orgpage'/>");
  });
  hooks.after(function() {
    $("#container").off().empty().remove();
    $(document).off();
  });
  QUnit.test("context with one parameter", function(assert) {
    let $container = $("#container");
    let flag = false;
    $container.find(".orgpage").orgContext([{name: "a", fn: () => flag = true}]);
    assert.ok(flag);
    assert.equal($container.find(".orgcontext").length, 0);
  });
  QUnit.test("test context works with parameters", function(assert) {
    let $container = $("#container");
    let flag = false;
    $container.find(".orgpage").orgContext([
      {name: "a", fn: () => flag = true},
      {name: "b", fn: "test"},
      {name: "org", fn: "test"},
    ]);
    assert.ok(!flag);
    let $context = $container.find(".orgcontext");
    assert.equal($context.find("button").length, 2);
    assert.equal($context.find("a").length, 2);
    $context.find("button").click();
    assert.ok(flag);
  });
});

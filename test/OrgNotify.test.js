QUnit.module("OrgNotify Tests", function(hooks) {
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
  QUnit.test("notification with content", function(assert) {
    let $page = $(".orgpage");
    $page.orgNotify({content: "bla"});
    let $notification = $page.find(".orgnotify");
    assert.equal($notification.length, 1);
    assert.equal($notification.find("input").length, 0);
    assert.equal($notification.find("button").length, 0);
  });
  QUnit.test("notification with all parameters", function(assert) {
    let $page = $(".orgpage");
    let flag = false;
    $page.orgNotify({
      content: "content",
      prompt: true,
      confirm: () => flag = true,
      value: "val",
    });
    let $notification = $page.find(".orgnotify");
    assert.equal($notification.find("input[type=text]").length, 1);
    assert.equal($notification.find("button").length, 2);
    $notification.find(".done").click();
    assert.ok(flag);
  });
  QUnit.test("multiple notification should create only one", function(assert) {
    let $page = $(".orgpage");
    $page.orgNotify({content: "1"});
    $page.orgNotify({content: "2"});
    assert.equal($page.find(".orgnotify").length, 1);
  });
});

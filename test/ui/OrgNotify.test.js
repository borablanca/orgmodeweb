QUnit.module("OrgNotify Tests", {
  "beforeEach": () => $(document).off(),
  "after": () => $(document).off()
});
QUnit.test("notification with message", (assert) => {
  const $page = $("#qunit-fixture")
    .addClass("orgpage")
    .orgNotify({"message": "message"});
  const $notification = $page.find(".orgnotify");
  const $message = $notification.find(".orgmessage");
  assert.equal($notification.length, 1);
  assert.equal($message.length, 1);
  assert.equal($message.text(), "message");
  assert.equal($notification.find("input").length, 0);
  assert.equal($notification.find("button").length, 0);
});
QUnit.test("notification with all parameters", (assert) => {
  let flag = false;
  const $page = $("#qunit-fixture").orgNotify({
    "message": "message",
    "prompt": 1,
    "value0": "val",
    "confirm": () => flag = true
  });
  const $notification = $page.find(".orgnotify");
  const $input = $notification.find("input[type=text]");
  assert.equal($input.length, 1);
  assert.equal($input.val(), "val");
  assert.equal($notification.find(".orgicon").length, 2);
  $notification.find(".done").click();
  assert.ok(flag);
});
QUnit.test("multiple notification should create only one", (assert) => {
  const $page = $("#qunit-fixture");
  $page.orgNotify({"message": "1"});
  $page.orgNotify({"message": "2"});
  assert.equal($page.find(".orgnotify").length, 1);
});

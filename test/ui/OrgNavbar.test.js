const ICONTYPE = ORG.Icons.ICONTYPE;
QUnit.module("OrgNavbar Tests", () => {
  QUnit.test("empty bar", (assert) => {
    assert.ok($("#qunit-fixture").orgNavbar().hasClass("orgnavbar"));
  });
  QUnit.test("text icon", (assert) => {
    const $bar = $("#qunit-fixture").orgNavbar({
      "org": {"type": ICONTYPE.TEXT, "fn": ""}
    });
    const $icon = $bar.find(".orgicon");
    assert.equal($icon.length, 1);
    assert.equal($icon.text(), "org");
  });

  QUnit.test("bar with a title", (assert) => {
    const $bar = $("#qunit-fixture").orgNavbar({
      "title": {"type": "Title"}
    });
    const $h1 = $bar.find("h1");
    assert.equal($h1.length, 1);
    assert.equal($h1.text(), "Title");
  });
  QUnit.test("bar with an icon button", (assert) => {
    let done = false;
    const $bar = $("#qunit-fixture").orgNavbar({
      "org": {"type": ICONTYPE.ICON, "fn": () => done = true}
    });
    const $iconButton = $bar.find("svg.orgicon.org");
    assert.equal($iconButton.length, 1);
    $iconButton.click();
    assert.ok(done);
  });
  QUnit.test("bar with button and title", (assert) => {
    let done = false;
    const $bar = $("#qunit-fixture").orgNavbar({
      "org": {"type": ICONTYPE.ICON, "fn": () => done = true},
      "title": {"type": "Title"}
    });
    let $barItem = $bar.find(".orgicon.org");
    assert.equal($barItem.length, 1);
    $barItem.click();
    assert.ok(done);
    $barItem = $barItem.next();
    assert.ok($barItem.is("h1"));
    assert.equal($barItem.text(), "Title");
  });
  QUnit.test("bar with title and button", (assert) => {
    const $bar = $("#qunit-fixture").orgNavbar({
      "title": {"type": "Title"},
      "org": {"type": ICONTYPE.ICON, "fn": ""}
    });
    let barItem = $bar.find(".orgicon.org");
    assert.equal(barItem.length, 1);
    barItem = barItem.prev();
    assert.ok(barItem.is("h1"));
    assert.equal(barItem.text(), "Title");
  });
  QUnit.todo("bar with context icon", (assert) => {

  });
});

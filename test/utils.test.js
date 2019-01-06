QUnit.module("utils Tests", function() {
  let isString = $.isString;
  QUnit.test("isString for empty param should return false", function(assert) {
    assert.notOk(isString());
  });
  QUnit.test("isString non-string params should return false", function(assert) {
    assert.notOk(isString(undefined));
    assert.notOk(isString(null));
    assert.notOk(isString(true));
    assert.notOk(isString(false));
    assert.notOk(isString(() => { }));
    assert.notOk(isString(function() { }));
    assert.notOk(isString({}));
    assert.notOk(isString([]));
    assert.notOk(isString(1.0));
    assert.notOk(isString(1));
  });
  QUnit.test("isString string param should return true", function(assert) {
    assert.ok(isString(""));
    assert.ok(isString("1"));
    assert.ok(isString("test"));
    assert.ok(isString("test"));
  });
  QUnit.test("markup - bold", function(assert) {
    assert.equal($.markup("*test*"), "<b>test</b>");
    assert.equal($.markup(" *test*"), " <b>test</b>");
    assert.equal($.markup("*test* "), "<b>test</b> ");
    assert.equal($.markup(" *test* "), " <b>test</b> ");
    assert.equal($.markup("  *test*   "), "  <b>test</b>   ");

    assert.equal($.markup("*test*."), "<b>test</b>.");
    assert.equal($.markup("*test*!"), "<b>test</b>!");
  });
  QUnit.test("markup - italic", function(assert) {
    assert.equal($.markup("/test/"), "<i>test</i>");
    assert.equal($.markup(" /test/"), " <i>test</i>");
    assert.equal($.markup("/test/ "), "<i>test</i> ");
    assert.equal($.markup(" /test/ "), " <i>test</i> ");
    assert.equal($.markup("  /test/   "), "  <i>test</i>   ");
  });
  QUnit.test("markup - underline", function(assert) {
    assert.equal($.markup("_test_"), "<u>test</u>");
    assert.equal($.markup(" _test_"), " <u>test</u>");
    assert.equal($.markup("_test_ "), "<u>test</u> ");
    assert.equal($.markup(" _test_ "), " <u>test</u> ");
    assert.equal($.markup("  _test_   "), "  <u>test</u>   ");
  });
  QUnit.test("markup - multiple in one line", function(assert) {
    assert.equal($.markup("*test* _test2_  *test4* /test3/"), "<b>test</b> <u>test2</u>  <b>test4</b> <i>test3</i>");
  });
  QUnit.test("markup - links", function(assert) {
    assert.equal($.markup("[[a][b]]"), "<a class=\"link\" href=\"a\">b</a>");
    assert.equal($.markup("*[[a][b]]*"), "<b><a class=\"link\" href=\"a\">b</a></b>");
    assert.equal($.markup("[[a][b]] _[[c][d]]_"), "<a class=\"link\" href=\"a\">b</a> <u><a class=\"link\" href=\"c\">d</a></u>");
    assert.equal($.markup("[[a][b]] *test*  [[c][d]]"), "<a class=\"link\" href=\"a\">b</a> <b>test</b>  <a class=\"link\" href=\"c\">d</a>");
  });
});

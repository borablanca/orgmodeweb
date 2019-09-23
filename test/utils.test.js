QUnit.module("utils Tests", () => {
  const isString = ORG.Utils.isString;
  const markup = ORG.Utils.markup;
  QUnit.test("isString for empty param should return false", (assert) => {
    assert.notOk(isString());
  });
  QUnit.test("isString non-string params should return false", (assert) => {
    assert.notOk(isString(undefined)); // eslint-disable-line no-undefined
    assert.notOk(isString(null));
    assert.notOk(isString(true));
    assert.notOk(isString(false));
    assert.notOk(isString(() => { })); // eslint-disable-line no-empty-function
    assert.notOk(isString(() => { })); // eslint-disable-line no-empty-function
    assert.notOk(isString({}));
    assert.notOk(isString([]));
    assert.notOk(isString(1.0));
    assert.notOk(isString(1));
  });
  QUnit.test("isString string param should return true", (assert) => {
    assert.ok(isString(""));
    assert.ok(isString("1"));
    assert.ok(isString("test"));
    assert.ok(isString("test"));
  });
  QUnit.test("markup - bold", (assert) => {
    assert.equal(markup("*test*"), "<b>test</b>");
    assert.equal(markup(" *test*"), " <b>test</b>");
    assert.equal(markup("*test* "), "<b>test</b> ");
    assert.equal(markup(" *test* "), " <b>test</b> ");
    assert.equal(markup("  *test*   "), "  <b>test</b>   ");

    assert.equal(markup("*test*."), "<b>test</b>.");
    assert.equal(markup("*test*!"), "<b>test</b>!");
  });
  QUnit.test("markup - italic", (assert) => {
    assert.equal(markup("/test/"), "<i>test</i>");
    assert.equal(markup(" /test/"), " <i>test</i>");
    assert.equal(markup("/test/ "), "<i>test</i> ");
    assert.equal(markup(" /test/ "), " <i>test</i> ");
    assert.equal(markup("  /test/   "), "  <i>test</i>   ");
  });
  QUnit.test("markup - underline", (assert) => {
    assert.equal(markup("_test_"), "<u>test</u>");
    assert.equal(markup(" _test_"), " <u>test</u>");
    assert.equal(markup("_test_ "), "<u>test</u> ");
    assert.equal(markup(" _test_ "), " <u>test</u> ");
    assert.equal(markup("  _test_   "), "  <u>test</u>   ");
  });
  QUnit.test("markup - multiple in one line", (assert) => {
    assert.equal(markup("*test* _test2_  *test4* /test3/"), "<b>test</b> <u>test2</u>  <b>test4</b> <i>test3</i>");
  });
  QUnit.test("markup - links", (assert) => {
    assert.equal(markup("[[a][b]]"), "<a class=\"orglink\" href=\"a\">b</a>");
    assert.equal(markup("*[[a][b]]*"), "<b><a class=\"orglink\" href=\"a\">b</a></b>");
    assert.equal(markup("[[a][b]] _[[c][d]]_"), "<a class=\"orglink\" href=\"a\">b</a> <u><a class=\"orglink\" href=\"c\">d</a></u>");
    assert.equal(markup("[[a][b]] *test*  [[c][d]]"), "<a class=\"orglink\" href=\"a\">b</a> <b>test</b>  <a class=\"orglink\" href=\"c\">d</a>");
  });
  QUnit.test("addToTimeStr", (assert) => {
    assert.equal(ORG.Utils.addToTimeStr("<2019-02-02>", "<+2d>"), "<2019-02-04>");
    assert.equal(ORG.Utils.addToTimeStr("<2019-02-02>", "<-1d>"), "<2019-02-01>");
    assert.equal(ORG.Utils.addToTimeStr("<2019-02-02>", "<+1w>"), "<2019-02-09>");
    assert.equal(ORG.Utils.addToTimeStr("<2019-02-02>", "<+1m>"), "<2019-03-02>");
    assert.equal(ORG.Utils.addToTimeStr("<2019-02-02>", "<+3y>"), "<2022-02-02>");
    assert.equal(ORG.Utils.addToTimeStr("<2019-02-28>", "<+2d>"), "<2019-03-02>");
  });
});

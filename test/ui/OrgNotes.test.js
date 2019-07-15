/* eslint-disable max-statements */
QUnit.module("OrgNotes Tests", (hooks) => {
  const createFile = (fileName, text) => ORG.Store.createFile(
    fileName,
    ORG.Store.SyncType.LOCAL,
    "",
    ORG.Parser.parseFile("file1", text, ORG.defaults)
  );
  hooks.afterEach(() => localStorage.clear());

  QUnit.test("file with empty nodes should display notice", (assert) => {
    const file = createFile("emptyFile", "");
    $("#qunit-fixture").orgNotes(file);
    assert.equal($(".orgnotes li", "#qunit-fixture").length, 1); // only orgbuffertext li
    assert.equal($(".orgnotes", "#qunit-fixture").length, 1);
    assert.equal($(".orgnotice", "#qunit-fixture").length, 1);
  });
  QUnit.test("node should be displayed properly", (assert) => {
    const file = createFile("file1", "* node1\n** node2");
    $("#qunit-fixture").orgNotes(file);
    assert.equal($(".orgnotes li", "#qunit-fixture").length, 3);
  });
  QUnit.test("edit mode", (assert) => {
    const file = createFile("file1", "* node heading\nbody text\nnext line\n\n\n* 2");
    $("#qunit-fixture").orgNotes(file);
    assert.equal($(".orgnotes li", "#qunit-fixture").length, 3);

    // change title
    $(".orgnotes li", "#qunit-fixture").eq(1).contextmenu();
    let $liedit = $(".orgnotes li.inedit", "#qunit-fixture");
    assert.equal($liedit.length, 1);
    const $inputText = $liedit.find("input[type=text]");
    const $textarea = $liedit.find("textarea");
    assert.equal($inputText.val(), "node heading");
    assert.equal($textarea.val(), "body text\nnext line\n\n");
    $inputText.val("changed");
    $liedit.find(".orgicon.done").click();
    assert.equal($(".orgnotes li.inedit", "#qunit-fixture").length, 0);
    assert.equal($(".orgnotes li", "#qunit-fixture").length, 3);
    assert.equal($(".orgnotes li .title", "#qunit-fixture").eq(0).text(), "changed");
    assert.ok($(".orgnavbar h1", "#qunit-fixture").eq(0).hasClass("sync" + ORG.Store.SyncStatus.MODIFIED));
    assert.equal(ORG.Store.getFileHeadings(file.id)[0].TITLE, "changed");

    // close
    $(".orgnotes li", "#qunit-fixture").eq(1).contextmenu();
    $liedit = $(".orgnotes li.inedit", "#qunit-fixture");
    $liedit.find(".orgicon.close").click();
    assert.equal($(".orgnotes li.inedit", "#qunit-fixture").length, 0);
    assert.equal($(".orgnotes li", "#qunit-fixture").length, 3);

    // delete
    $(".orgnotes li", "#qunit-fixture").eq(1).contextmenu();
    $(".orgnotes li.inedit .orgicon.delete", "#qunit-fixture").click();
    $(".orgnotify .orgicon.done", "#qunit-fixture").click();
    assert.equal($(".orgnotes li.inedit", "#qunit-fixture").length, 0);
    assert.equal($(".orgnotes li", "#qunit-fixture").length, 2);
    assert.equal(ORG.Store.getFileHeadings(file.id)[0].TITLE, "2");
    $(".orgnotes li", "#qunit-fixture").eq(1).contextmenu();
    $(".orgnotes li.inedit .orgicon.delete", "#qunit-fixture").click();
    $(".orgnotify .orgicon.done", "#qunit-fixture").click();
    assert.equal($(".orgnotice", "#qunit-fixture").length, 1);
  });

  QUnit.test("drawers", (assert) => {
    const file = createFile("file1", "* node heading\nbody text\n:DRAWER1:\ndrawer text 1\ndrawer text 2\n:END:");
    $("#qunit-fixture").orgNotes(file);
    $(".orgnotes li + li").click();
    assert.equal($(".orgnotes li + li .collapsible").length, 1);
  });

  QUnit.test("buffer text", (assert) => {
    const file = createFile("file1", "\ntext\nmoretext\n\n* node");
    $("#qunit-fixture").orgNotes(file);
    const $pre = $(".orgnotes .orgbuffertext pre", "#qunit-fixture");
    assert.equal($pre.html(), "text<br>moretext<br><br>");
  });
});

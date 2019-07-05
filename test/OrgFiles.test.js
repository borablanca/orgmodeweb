/* eslint-disable max-statements */
QUnit.module("OrgFiles Tests", (hooks) => {
  hooks.beforeEach(() => {
    localStorage.clear();
    $(document).off();
  });
  hooks.after(() => {
    localStorage.clear();
    $(document).off();
  });

  QUnit.test("show empty file list", (assert) => {
    const $page = $("#qunit-fixture");
    const $orgfiles = $page.orgFiles().find(".orgfiles");
    assert.ok($orgfiles.hasClass("orgfiles"));
    assert.equal($page.find(".orgnotice").length, 1);
  });
  QUnit.test("show file list", (assert) => {
    ORG.Store.createFile("file1", ORG.Store.SyncType.DBOX);
    ORG.Store.createFile("file2");
    ORG.Store.createFile("file3");
    const $orgFiles = $("#qunit-fixture").addClass("orgpage").orgFiles(ORG.Store.getFileList());
    assert.ok($orgFiles.find(".orgfiles").length, 1);
    let $li = $orgFiles.find(".orgfiles li");
    assert.equal($li.length, 3);
    assert.ok($li.eq(0).hasClass("sync" + ORG.Store.SyncStatus.SYNC));
    assert.equal($li.eq(0).find(".orgicon .dbox").length, 1);
    assert.ok($li.eq(1).hasClass("sync" + ORG.Store.SyncStatus.SYNC));
    assert.equal($li.eq(1).find(".orgicon .file").length, 1);
    assert.equal($li.find(">a").length, 3);

    // edit
    $li.eq(0).contextmenu();
    assert.equal($(".orgnotify").length, 1);
    const $notifyButtons = $orgFiles.find(".orgnotify .orgicon");
    assert.equal($notifyButtons.length, 3);
    $notifyButtons.eq(0).click();
    assert.equal($(".orgfiles li.inedit").length, 1);
    assert.equal($orgFiles.find(".orgfiles li.inedit .orgicon").length, 4);
    $orgFiles.find(".orgfiles li.inedit .orgicon.close").click();
    assert.equal($(".orgfiles li.inedit").length, 0);
    assert.equal($(".orgfiles li + li").length, 2);

    $li.eq(1).contextmenu();
    assert.equal($(".orgfiles li.inedit").length, 1);
    $orgFiles.find(".orgfiles li.inedit .orgicon.close").click();
    assert.equal($(".orgfiles li:not(.inedit) + li:not(.inedit)").length, 2);

    // delete
    $li = $orgFiles.find(".orgfiles li");
    $li.eq(1).contextmenu();
    assert.equal($(".orgfiles li.inedit .orgicon.delete").length, 1);
    $orgFiles.find(".orgfiles li.inedit .orgicon.delete").click();
    assert.equal($(".orgnotify .orgicon.done").length, 1);
    $orgFiles.find(".orgnotify .orgicon.done").click();
    assert.equal($(".orgfiles li").length, 2);
    assert.equal(ORG.Store.getFileList().length, 2);

    // change name
    $orgFiles.find(".orgfiles li").eq(0).contextmenu();
    $orgFiles.find(".orgnotify .orgicon").eq(0).click();
    $orgFiles.find(".orgfiles li.inedit input").val("newFileName");
    $orgFiles.find(".orgfiles li.inedit .orgicon.done").click();
    assert.equal(ORG.Store.getFileList().length, 2);
    assert.ok(ORG.Store.fileExists("newFileName", ORG.Store.SyncType.DBOX));
  });
});

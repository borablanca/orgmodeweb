QUnit.module("OrgFiles Tests", function(hooks) {
  hooks.before(function() {
    $("body").append("<div id='app' style='display:none;'></div>");
  });
  hooks.beforeEach(function() {
    ORG.Store.deleteFile(Object.keys(ORG.Store.getFileNames()));
    $("#app").empty();
  });
  hooks.after(function() {
    ORG.Store.deleteFile(Object.keys(ORG.Store.getFileNames()));
    $("#app").empty().remove();
    $(document).off();
  });

  QUnit.test("show empty file list", function(assert) {
    $("#app").orgFiles();
    assert.dom("#app .orgnotice").exists();
  });
  QUnit.test("show file list", function(assert) {
    ORG.Store.setFile("file1");
    ORG.Store.setFile("file2");
    ORG.Store.setFile("file3");
    let $app = $("#app").orgFiles({
      file1: {sync: 0, dbox: "bla"},
      file2: {},
      file3: {},
    });
    assert.dom("#app .orgfiles").exists();
    let $files = $app.find(".orgfiles li");
    assert.equal($files.length, 3);
    assert.dom($files[0]).hasClass("sync");
    assert.notOk($files[1].classList.length);
    assert.equal($files.find("a").length, 3);

    // edit
    $files.eq(0).contextmenu();
    assert.dom(".orgcontext").exists();
    let $ctxButtons = $app.find(".orgcontext button");
    assert.equal($ctxButtons.length, 4);
    $ctxButtons.eq(0).click();
    assert.dom(".orgfiles li.edit").exists();
    assert.equal($app.find(".orgfiles li.edit .orgicon").length, 4);
    $app.find(".orgfiles li.edit .orgicon.close").click();
    assert.dom(".orgfiles li.edit").doesNotExist();
    assert.dom(".orgfiles li + li").exists();

    $files.eq(1).contextmenu();
    assert.dom(".orgfiles li.edit").exists();
    $app.find(".orgfiles li.edit .orgicon.close").click();
    assert.dom(".orgfiles li:not(.edit) + li:not(.edit)").exists();

    // delete
    $files = $app.find(".orgfiles li");
    $files.eq(1).contextmenu();
    assert.dom(".orgfiles li.edit .orgicon.delete").exists();
    $app.find(".orgfiles li.edit .orgicon.delete").click();
    assert.dom(".orgnotify button.done").exists();
    $app.find(".orgnotify button.done").click();
    assert.equal($(".orgfiles li:not(.edit)").length, 2);
    assert.equal(Object.keys(ORG.Store.getFileNames()).length, 2);

    // change name
    $app.find(".orgfiles li").eq(0).contextmenu();
    $app.find(".orgcontext button").eq(0).click();
    $app.find(".orgfiles li.edit input").val("newFileName");
    $app.find(".orgfiles li.edit .orgicon.done").click();
    let fileNames = ORG.Store.getFileNames();
    assert.equal(Object.keys(fileNames).length, 2);
    assert.ok(fileNames.hasOwnProperty("newFileName"));
  });
});

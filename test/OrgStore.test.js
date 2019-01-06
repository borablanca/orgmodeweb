QUnit.module("OrgStore Tests", function(hooks) {
  hooks.beforeEach(function() {
    localStorage.clear();
  });
  hooks.after(function() {
    localStorage.clear();
  });

  QUnit.test("file name empty, null, undefined should not create file", function(assert) {
    assert.throws(function() {
      ORG.Store.setFile();
    });
    assert.deepEqual(ORG.Store.getFileNames(), {});
    assert.equal(localStorage.length, 0);

    assert.throws(function() {
      ORG.Store.setFile("");
    });
    assert.deepEqual(ORG.Store.getFileNames(), {});
    assert.equal(localStorage.length, 0);

    assert.throws(function() {
      ORG.Store.setFile(null);
    });
    assert.deepEqual(ORG.Store.getFileNames(), {});
    assert.equal(localStorage.length, 0);

    assert.throws(function() {
      ORG.Store.setFile(undefined);
    });
    assert.deepEqual(ORG.Store.getFileNames(), {});
    assert.equal(localStorage.length, 0);
  });
  QUnit.test("file name contains illegal characters", function(assert) {
    assert.throws(function() { // illegal characters in file name
      ORG.Store.setFile("\\ır/ıod:k*4od?ui\" a<uiae>s");
    });
    assert.deepEqual(ORG.Store.getFileNames(), {});
    assert.equal(localStorage.length, 0);
  });
  QUnit.test("legal string creates new file", function(assert) {
    assert.ok(ORG.Store.setFile("file name"));
    assert.ok(ORG.Store.getFileNames()["file name"]);
    assert.equal(localStorage.length, 2); // filenames and file itself
  });

  QUnit.test("check file exists", function(assert) {
    ORG.Store.setFile("file name");
    assert.notOk(ORG.Store.fileExists());
    assert.notOk(ORG.Store.fileExists(""));
    assert.notOk(ORG.Store.fileExists(null));
    assert.notOk(ORG.Store.fileExists(undefined));
    assert.notOk(ORG.Store.fileExists("not file"));
    assert.ok(ORG.Store.fileExists("file name"));
  });
  QUnit.test("get file", function(assert) {
    ORG.Store.setFile("file name");
    assert.notOk(ORG.Store.getFile());
    assert.notOk(ORG.Store.getFile(""));
    assert.notOk(ORG.Store.getFile(null));
    assert.notOk(ORG.Store.getFile(undefined));
    assert.notOk(ORG.Store.getFile("not file"));
    assert.ok(ORG.Store.getFile("file name"));
    assert.equal(ORG.Store.getFile("file name")[0].fileName, "file name");
    assert.equal(ORG.Store.getFile("file name")[0].text, "");
  });
  QUnit.test("get file names", function(assert) {
    ORG.Store.setFile("file1");
    ORG.Store.setFile("file2");
    ORG.Store.setFile("file3");
    assert.equal(Object.keys(ORG.Store.getFileNames()).length, 3);
  });
  QUnit.test("delete file", function(assert) {
    ORG.Store.setFile("file1");
    ORG.Store.deleteFile();
    ORG.Store.deleteFile("");
    ORG.Store.deleteFile(null);
    ORG.Store.deleteFile(undefined);
    ORG.Store.deleteFile("not a file");
    assert.ok(ORG.Store.getFile("file1"));
    ORG.Store.deleteFile("file1");
    assert.notOk(ORG.Store.getFile("file1"));
  });
  QUnit.test("clear storage", function(assert) {
    ORG.Store.setFile("file1");
    ORG.Store.setFile("file2");
    assert.equal(Object.keys(ORG.Store.getFileNames()).length, 2);
    assert.ok(ORG.Store.deleteFile(["file1", "file2"]));
    assert.equal(Object.keys(ORG.Store.getFileNames()).length, 0);
  });
  QUnit.test("create file", function(assert) {
    ORG.Store.setFile("file1", []);
    let file = ORG.Store.getFile("file1");
    assert.equal(file[0].text, "");

    assert.throws(function() {
      ORG.Store.setFile("file1", [{}]); // duplicate file name
    });
    assert.equal(ORG.Store.getFile("file1")[0].text, "");
    ORG.Store.setFile("file1", [{}], "file1");
    assert.equal(ORG.Store.getFile("file1")[0].text, "");

    assert.throws(function() {
      ORG.Store.setFile("file1", [{fileName: "name"}]); // duplicate file name
    });
    ORG.Store.setFile("file1", [{fileName: "name"}], "file1");
    assert.equal(ORG.Store.getFile("file1")[0].text, "");
  });
  QUnit.test("update existing file", function(assert) {
    ORG.Store.setFile("file1", []);
    assert.ok(ORG.Store.getFileNames()["file1"]);
    ORG.Store.setFile("file1updated", [], undefined);
    assert.equal(ORG.Store.getFile("file1")[0].fileName, "file1");
    ORG.Store.setFile("file1updated", [], "file1");
    assert.notOk(ORG.Store.getFile("file1"));
    assert.ok(ORG.Store.getFile("file1updated"));
    assert.equal(ORG.Store.getFile("file1updated")[0].fileName, "file1updated");
  });
});

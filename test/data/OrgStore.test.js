QUnit.module("OrgStore Tests", (hooks) => {
  hooks.beforeEach(() => localStorage.clear());
  hooks.after(() => localStorage.clear());

  const store = ORG.Store;
  const defaults = ORG.defaults;
  QUnit.test("file name empty, null, undefined should not create file", (assert) => {
    assert.throws(
      () => store.createFile(),
      /File name cannot be empty/
    );
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);

    assert.throws(
      () => store.createFile(""),
      /File name cannot be empty/
    );
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);

    assert.throws(
      () => store.createFile(null),
      /File name cannot be empty/
    );
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);
  });
  QUnit.test("file name contains illegal characters", (assert) => {
    assert.throws(
      () => store.createFile("\\ır/ıod:k*4od?ui\" a<uiae>s"),
      /File name contains illegal characters/
    );
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);
  });
  QUnit.test("legal string creates new file", (assert) => {
    store.createFile("file name");
    assert.equal(store.getFileList()[0].name, "file name");
    assert.ok(store.fileExists("file name"));
    assert.equal(localStorage.length, 2); // filenames and file itself
  });
  QUnit.test("create file", (assert) => {
    const file = store.createFile("file1");
    const fileHeadings = store.getFileHeadings(file, defaults);
    assert.equal(fileHeadings.TEXT.length, 0);

    assert.throws(
      () => store.createFile(file.name), // duplicate file name
      /There is a file with same name/
    );
  });
  QUnit.test("update existing file", (assert) => {
    const file = store.createFile("file1");
    assert.equal(store.getFileList().length, 1);
    assert.equal(store.getFileHeadings(file, defaults).FILENAME, "file1");

    const updatedFile = Object.assign({}, file, {"name": "file1updated"});
    store.updateFile(updatedFile);
    assert.ok(store.getFileHeadings(updatedFile, defaults));
    assert.equal(store.getFileHeadings(updatedFile, defaults).FILENAME, "file1updated");

    store.updateFile(
      updatedFile,
      Object.assign([{"LVL": 1, "PROPS": {}, "TITLE": "t", "TEXT": []}], {
        "TEXT": ""
      })
    );
    assert.equal(store.getFileHeadings(updatedFile, defaults).length, 1);
  });
  QUnit.test("check file exists", (assert) => {
    store.createFile("file name");
    assert.notOk(store.fileExists());
    assert.notOk(store.fileExists(""));
    assert.notOk(store.fileExists(null));
    assert.notOk(store.fileExists("not file"));
    assert.ok(store.fileExists("file name"));
    assert.ok(store.fileExists("file name", store.SyncType.LOCAL));
    assert.ok(store.fileExists("file name", store.SyncType.LOCAL, "smth")); // for local files, path is not important

    store.createFile("dbox file name", store.SyncType.DBOX, "");
    assert.notOk(store.fileExists("dbox file name", store.SyncType.DBOX, "a")); // for sync files, path is important
    assert.ok(store.fileExists("dbox file name", store.SyncType.DBOX, ""));
  });
  QUnit.test("get file", (assert) => {
    const file = store.createFile("file name");
    assert.notOk(store.getFileHeadings());
    assert.notOk(store.getFileHeadings(""));
    assert.notOk(store.getFileHeadings("not file"));
    const fileHeadings = store.getFileHeadings(file, defaults);
    assert.equal(fileHeadings.FILENAME, "file name");
    assert.equal(fileHeadings.TEXT.length, 0);
  });
  QUnit.test("get file names", (assert) => {
    store.createFile("file1");
    store.createFile("file2");
    store.createFile("file3");
    assert.equal(store.getFileList().length, 3);
    assert.ok(store.fileExists("file1"));
    assert.ok(store.fileExists("file2"));
    assert.ok(store.fileExists("file3"));
  });
  QUnit.test("delete file", (assert) => {
    const file = store.createFile("file1");
    assert.throws(
      store.deleteFile,
      /File not found/
    );
    assert.throws(
      () => store.deleteFile(""),
      /File not found/
    );
    assert.throws(
      () => store.deleteFile(null),
      /File not found/
    );
    assert.throws(
      () => store.deleteFile("not a file"),
      /File not found/
    );
    assert.ok(store.getFileHeadings(file, defaults));
    assert.ok(store.deleteFile(file));
    assert.notOk(store.getFileHeadings(file, defaults));
  });
  QUnit.test("set file property", (assert) => {
    const file = store.createFile("file1");
    store.setFileProperty(file, {"prop": "val"});
    assert.equal(store.getFileList()[0].prop, "val");
  });
});

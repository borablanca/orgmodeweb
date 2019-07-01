QUnit.module("OrgStore Tests", (hooks) => {
  hooks.beforeEach(() => localStorage.clear());
  hooks.after(() => localStorage.clear());

  const store = ORG.Store;
  const defaults = ORG.defaults;
  const createNodes = (fileName) => Object.assign([], {
    "FILENAME": fileName,
    "CATEGORY": fileName,
    "TEXT": "",
    "TODO": "TODO | DONE",
  });
  QUnit.test("file name empty, null, undefined should not create file", (assert) => {
    assert.throws(() => store.saveFile());
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);

    assert.throws(() => store.saveFile(""));
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);

    assert.throws(() => store.saveFile(null));
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);

    assert.throws(() => store.saveFile());
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);
  });
  QUnit.test("file name contains illegal characters", (assert) => {
    assert.throws(() => store.saveFile({"name": "\\ır/ıod:k*4od?ui\" a<uiae>s"})); // illegal characters in file name
    assert.deepEqual(store.getFileList(), []);
    assert.equal(localStorage.length, 0);
  });
  QUnit.test("legal string creates new file", (assert) => {
    store.saveFile({"name": "file name"});
    assert.equal(store.getFileList()[0].name, "file name");
    assert.ok(store.fileExists("file name"));
    assert.equal(localStorage.length, 2); // filenames and file itself
  });
  QUnit.test("create file", (assert) => {
    const _file = {"name": "file1"};
    const nodes = createNodes();
    store.saveFile(_file, nodes);
    const file = store.getFileHeadings(_file, defaults);
    assert.equal(file.TEXT.length, 0);

    assert.throws(() => store.saveFile(_file, nodes)); // duplicate file name
    assert.equal(store.getFileHeadings(_file, defaults).TEXT.length, 0);
    store.saveFile(_file, nodes, "file1");
    assert.equal(store.getFileHeadings(_file, defaults).TEXT.length, 0);

    assert.throws(() => {
      nodes.FILENAME = "name";
      store.saveFile(_file, nodes); // duplicate file name
    });
    store.saveFile(_file, nodes, "file1");
    assert.equal(store.getFileHeadings(_file, defaults).TEXT.length, 0);
  });
  QUnit.test("update existing file", (assert) => {
    const _file = {"name": "file1"};
    store.saveFile(_file, []);
    assert.ok(store.getFileList()[0]);
    assert.equal(store.getFileHeadings(_file, defaults).FILENAME, "file1");

    store.saveFile({"name": "file1updated"}, null, "file1");
    assert.notOk(store.getFileHeadings(_file));
    assert.equal(store.getFileHeadings(
      {"name": "file1updated"},
      defaults
    ).FILENAME, "file1updated");

    store.saveFile(
      {"name": "file1updated"},
      Object.assign([{"LVL": 1, "PROPS": {}, "TITLE": "t", "TEXT": []}], {
        "TEXT": ""
      }),
      "file1updated"
    );
    assert.equal(store.getFileHeadings(
      {"name": "file1updated"},
      defaults
    ).length, 1);
  });
  QUnit.test("check file exists", (assert) => {
    store.saveFile({"name": "file name"});
    assert.notOk(store.fileExists());
    assert.notOk(store.fileExists(""));
    assert.notOk(store.fileExists(null));
    assert.notOk(store.fileExists("not file"));
    assert.ok(store.fileExists("file name"));
  });
  QUnit.test("get file", (assert) => {
    store.saveFile({"name": "file name"});
    assert.notOk(store.getFileHeadings());
    assert.notOk(store.getFileHeadings(""));
    assert.notOk(store.getFileHeadings(null));
    assert.notOk(store.getFileHeadings("not file"));
    const file = store.getFileHeadings({"name": "file name"}, defaults);
    assert.equal(file.FILENAME, "file name");
    assert.equal(file.TEXT.length, 0);
  });
  QUnit.test("get file names", (assert) => {
    store.saveFile({"name": "file1"});
    store.saveFile({"name": "file2"});
    store.saveFile({"name": "file3"});
    assert.equal(store.getFileList().length, 3);
    assert.ok(store.fileExists("file1"));
    assert.ok(store.fileExists("file2"));
    assert.ok(store.fileExists("file3"));
  });
  QUnit.test("delete file", (assert) => {
    store.saveFile({"name": "file1"});
    assert.throws(store.deleteFile);
    assert.throws(() => store.deleteFile(""));
    assert.throws(() => store.deleteFile(null));
    assert.throws(() => store.deleteFile("not a file"));
    assert.ok(store.getFileHeadings({"name": "file1"}, defaults));
    assert.ok(store.deleteFile("file1"));
    assert.notOk(store.getFileHeadings("file1", defaults));
  });
  QUnit.test("clear storage", (assert) => {
    store.saveFile({"name": "file1"});
    store.saveFile({"name": "file2"});
    assert.equal(Object.keys(store.getFileList()).length, 2);
    ["file1", "file2"].map((file) => store.deleteFile(file));
    assert.equal(Object.keys(store.getFileList()).length, 0);
  });
  QUnit.test("set file property", (assert) => {
    store.saveFile({"name": "file1"});
    store.setFileProperty("file1", {"prop": "val"});
    assert.equal(store.getFileList()[0].prop, "val");
  });
});

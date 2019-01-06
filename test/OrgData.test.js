QUnit.module("OrgDataEditor Tests", function(hooks) {
  const settings = {
    "todo-keywords": ORG.defaults["todo-keywords"]
      .replace(/\([^)]*\)|\|/g, "")
      .split(" ")
      .filter(Boolean),
  };

  QUnit.test("change TODO keyword of node data", function(assert) {
    assert.equal(ORG.Data.set({}, {todo: "NEXT"}).todo, "NEXT");

    assert.equal(ORG.Data.setWithCursor({}, "todo", settings["todo-keywords"], 1).todo, "TODO");
    assert.equal(ORG.Data.setWithCursor({todo: "TODO"}, "todo", settings["todo-keywords"], 1).todo, "DONE");
    assert.equal(ORG.Data.setWithCursor({todo: "DONE"}, "todo", settings["todo-keywords"], 1).todo, undefined);

    assert.equal(ORG.Data.setWithCursor({}, "todo", settings["todo-keywords"], 0).todo, "DONE");
    assert.equal(ORG.Data.setWithCursor({todo: "TODO"}, "todo", settings["todo-keywords"], 0).todo, undefined);
    assert.equal(ORG.Data.setWithCursor({todo: "DONE"}, "todo", settings["todo-keywords"], 0).todo, "TODO");
  });
  QUnit.test("change PRI letter of node data", function(assert) {
    assert.equal(ORG.Data.set({}, {pri: "A"}).pri, "A");

    assert.equal(ORG.Data.setWithCursor({}, "todo", settings["todo-keywords"], 1).todo, "TODO");
    assert.equal(ORG.Data.setWithCursor({todo: "TODO"}, "todo", settings["todo-keywords"], 1).todo, "DONE");
    assert.equal(ORG.Data.setWithCursor({todo: "DONE"}, "todo", settings["todo-keywords"], 1).todo, undefined);

    assert.equal(ORG.Data.setWithCursor({}, "todo", settings["todo-keywords"], 0).todo, "DONE");
    assert.equal(ORG.Data.setWithCursor({todo: "TODO"}, "todo", settings["todo-keywords"], 0).todo, undefined);
    assert.equal(ORG.Data.setWithCursor({todo: "DONE"}, "todo", settings["todo-keywords"], 0).todo, "TODO");
  });
  QUnit.test("set multiple fields of node data", function(assert) {
    let data = ORG.Data.set(
      {todo: "TODO"},
      {
        todo: undefined,
        pri: "B",
      });
    assert.equal(data.todo, undefined);
    assert.equal(data.pri, "B");
  });
  QUnit.test("set title of node data", function(assert) {
    assert.equal(ORG.Data.set({}, {title: "test"}).title, "test");
    assert.equal(ORG.Data.set({title: "old"}, {title: "test"}).title, "test");
    assert.equal(ORG.Data.set({title: "old"}, {title: undefined}).title, undefined);
    let data = ORG.Data.set(
      {todo: "TODO"},
      {
        todo: "NEXT",
        title: "new title",
        pri: "C",
      });
    assert.equal(data.todo, "NEXT");
    assert.equal(data.title, "new title");
    assert.equal(data.pri, "C");
  });
  QUnit.test("set tags of node data", function(assert) {
    assert.equal(ORG.Data.set({}, {tags: ":tag1:tag2:"}).tags, ":tag1:tag2:");
  });

  QUnit.test("toggle tag of node data", function(assert) {
    assert.equal(ORG.Data.toggleTag({}, "tag1").tags, ":tag1:");
    assert.equal(ORG.Data.toggleTag({tags: ":tag1:"}, "tag2").tags, ":tag1:tag2:");
    assert.equal(ORG.Data.toggleTag({tags: ":tag1:"}, "tag1").tags, undefined);
    assert.equal(ORG.Data.toggleTag({tags: ":tag1:tag2:"}, "tag1").tags, ":tag2:");
  });
});

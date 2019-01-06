QUnit.module("OrgParser Tests", function() {
  const orgfile = `#+SEQ_TODO: TODO WAIT | DONE

* only title heading
** TODO heading with todo kwd
some text
* [#A] heading with PRIORITY




* heading with two tags     :tag1:tag2:
* TODO [#C] heading with TODO and PRIORITY
* TODO heading with TODO and three tags     :tag1:tag2:tag3:
text
some more text
* [#B] heading with PRIORITY and a tag      :tag1:
* DONE [#D] heading with TODO, PRIORITY and two tags        :tag1:tag2:
* inside title tags :tag1:tag2: shouldn't be counted, this has no tags!
** DONE level 2 with TODO
*** [#B] level 3 with a tag     :tag1:
* TODO [#A] headline with _*:b some #+ #! + ! <today> characters  :tag:
* heading <2018-02-05 Mon 12:00 .+1d> with timestamp
* 
empty title heading

* TODO
empty title heading with todo
* [#A]
empty title heading with priority
* :tag:
empty title heading with tag
* DONE [#E] :tag:
empty title heading with all
* WAIT[#A] no space btw todo and PRIORITY works
this node also check SEQ_TODO of the page!
* [#B]no space btw PRIORITY and title works
*nospace after star is a text of previous node

* simple timestamp in title <2018-02-05> and scheduled
SCHEDULED: <2018-02-06 10:00>
* timestamp with deadline
DEADLINE: <2018-02-06 Mon 11:00>
* both deadline and scheduled
SCHEDULED: <2018-02-06 Mon 10:00> DEADLINE: <2018-02-06 Mon 11:00>
* both deadline and scheduled swap locations
 DEADLINE: <2018-02-06 Mon 11:00> SCHEDULED: <2018-02-06 Mon 10:00>
* mistake in deadline text not works
DEADLINE <2018-02-06 11:00>
* mistake in deadline text not works
DEADLIN: <2018-02-06 Sun 11:00>
* multiline deadline and scheduled and a timstamp
SCHEDULED: <2018-02-08 10:00> 
DEADLINE: <2018-02-07 Tue 11:00>
<2018-02-09>
* timerange scheduled double dash
SCHEDULED: <2018-02-08>--<2018-02-10>
* timerange scheduled single dash
SCHEDULED: <2018-02-08>-<2018-02-10>
* timerange scheduled and deadline
SCHEDULED: <2018-02-08>-<2018-02-10> DEADLINE: <2018-02-07 11:00>
* timerange scheduled and deadline swapped
SCHEDULED: <2018-02-08>-<2018-02-10> DEADLINE: <2018-02-07 11:00>
* mistake in timestamp not work, it is only text
SCHEDULED: <2018-02-08
* timestamp range
<2018-02-09>--<2018-02-19>
* multiple timestamps
<2018-02-09>--<2018-02-19><2018-02-19>
<2018-02-19>
* text before schedule works
some text SCHEDULED: <2018-02-09>--<2018-02-19>
* schedule with time-range
SCHEDULED: <2018-02-09 12:00-12:45>
* schedule with time and repeat
SCHEDULED: <2018-02-09 12:00 .+1d>
* schedule with time-range and repeat
SCHEDULED: <2018-02-09 12:00-13:00 ++2w>
* deadline with warning days
DEADLINE: <2018-02-09 Wed -2d>
* deadline with warning days with repeater
DEADLINE: <2018-02-09 +3m -7d>
* deadline with warning days with hours and repeater
DEADLINE: <2018-02-09 Mon 12:00 +3m -1w>
* schedule with warning days with repeater with hour-range and delay
SCHEDULED: <2018-02-09 Fri 09:10--11:00 +3m -7d>
* schedule with warning days with hour-range with repetar rmax and delay
SCHEDULED: <2018-02-09 Fri 09:10--11:00 .+1d/2d -7d>
* schedule with warning days with repetar rmax and delay
SCHEDULED: <2018-02-09 Fri ++1d/2d>
* timestamp in <2018-02-09 Fri ++1d/2d>--<2018-02-10 Fri> title
* inactive timestamps in title [2018-02-09 Fri] and content
some text [2018-02-10] some more text[2018-02-10]more
* unproper PROPERTY drawer <2018-04-12>
:PROPERTIES:
:prop1: 1
:prop2  4
* next item`;

  let settings = ORG.defaults;
  let nodes = ORG.Parser.parse("test.org", orgfile, settings);

  QUnit.test("undefined file", function(assert) {
    assert.deepEqual(ORG.Parser.parse("fname", undefined, settings), [{fileName: "fname", text: ""}]);
  });
  QUnit.test("empty file", function(assert) {
    assert.deepEqual(ORG.Parser.parse("fname", "", settings), [{fileName: "fname", text: ""}]);
  });
  QUnit.test("text only file", function(assert) {
    assert.deepEqual(ORG.Parser.parse("fname", "some text", settings), [{fileName: "fname", text: "some text\n"}]);
  });
  QUnit.test("start with heading", function(assert) {
    let nodes = ORG.Parser.parse("fname", "* Heading", settings);
    assert.equal(nodes.length, 2);
    assert.equal(nodes[1].title, "Heading");
  });
  QUnit.test("start with empty line then heading", function(assert) {
    let nodes = ORG.Parser.parse("fname", "\n* Heading", settings);
    assert.equal(nodes.length, 2);
    assert.equal(nodes[1].title, "Heading");
  });

  QUnit.test("only title heading", function(assert) {
    assert.equal(nodes[1].title, "only title heading");
    assert.equal(nodes[1].todo, undefined);
    assert.equal(nodes[1].lvl, 1);
    assert.equal(nodes[1].pri, undefined);
    assert.equal(nodes[1].tags, undefined);
    assert.equal(nodes[1].text, "");
  });

  QUnit.test("heading with todo kwd", function(assert) {
    assert.equal(nodes[2].title, "heading with todo kwd");
    assert.equal(nodes[2].todo, "TODO");
    assert.equal(nodes[2].lvl, 2);
    assert.equal(nodes[2].pri, undefined);
    assert.equal(nodes[2].tags, undefined);
    assert.equal(nodes[2].text.trim(), "some text");
  });
  QUnit.test("heading with PRIORITY", function(assert) {
    assert.equal(nodes[3].title.trim(), "heading with PRIORITY");
    assert.equal(nodes[3].todo, undefined);
    assert.equal(nodes[3].lvl, 1);
    assert.equal(nodes[3].pri, "A");
    assert.equal(nodes[3].tags, undefined);
    assert.equal(nodes[3].text, "\n\n\n\n");
  });
  QUnit.test("heading with two tags", function(assert) {
    assert.equal(nodes[4].title, "heading with two tags");
    assert.equal(nodes[4].todo, undefined);
    assert.equal(nodes[4].lvl, 1);
    assert.equal(nodes[4].pri, undefined);
    assert.equal(nodes[4].tags, ":tag1:tag2:");
    assert.equal(nodes[4].text, "");
  });
  QUnit.test("heading with TODO and PRIORITY", function(assert) {
    assert.equal(nodes[5].title.trim(), "heading with TODO and PRIORITY");
    assert.equal(nodes[5].todo, "TODO");
    assert.equal(nodes[5].lvl, 1);
    assert.equal(nodes[5].pri, "C");
    assert.equal(nodes[5].tags, undefined);
    assert.equal(nodes[5].text, "");
  });
  QUnit.test("heading with TODO and three tags", function(assert) {
    assert.equal(nodes[6].title, "heading with TODO and three tags");
    assert.equal(nodes[6].todo, "TODO");
    assert.equal(nodes[6].lvl, 1);
    assert.equal(nodes[6].pri, undefined);
    assert.equal(nodes[6].tags, ":tag1:tag2:tag3:");
    assert.equal(nodes[6].text.trim(), "text\nsome more text");
  });

  QUnit.test("heading with PRIORITY and a tag", function(assert) {
    assert.equal(nodes[7].title.trim(), "heading with PRIORITY and a tag");
    assert.equal(nodes[7].todo, undefined);
    assert.equal(nodes[7].lvl, 1);
    assert.equal(nodes[7].pri, "B");
    assert.equal(nodes[7].tags, ":tag1:");
  });
  QUnit.test("heading with TODO, PRIORITY and two tags", function(assert) {
    assert.equal(nodes[8].title.trim(), "heading with TODO, PRIORITY and two tags");
    assert.equal(nodes[8].todo, "DONE");
    assert.equal(nodes[8].lvl, 1);
    assert.equal(nodes[8].pri, "D");
    assert.equal(nodes[8].tags, ":tag1:tag2:");
  });
  QUnit.test("inside title tags :tag1:tag2: shouldn't be counted, this has no tags!", function(assert) {
    assert.equal(nodes[9].title, "inside title tags :tag1:tag2: shouldn't be counted, this has no tags!");
    assert.equal(nodes[9].todo, undefined);
    assert.equal(nodes[9].lvl, 1);
    assert.equal(nodes[9].pri, undefined);
    assert.equal(nodes[9].tags, undefined);
  });
  QUnit.test("level 2 with TODO", function(assert) {
    assert.equal(nodes[10].title, "level 2 with TODO");
    assert.equal(nodes[10].todo, "DONE");
    assert.equal(nodes[10].lvl, 2);
    assert.equal(nodes[10].pri, undefined);
    assert.equal(nodes[10].tags, undefined);
  });
  QUnit.test("level 3 with a tag", function(assert) {
    assert.equal(nodes[11].title.trim(), "level 3 with a tag");
    assert.equal(nodes[11].todo, undefined);
    assert.equal(nodes[11].lvl, 3);
    assert.equal(nodes[11].pri, "B");
    assert.equal(nodes[11].tags, ":tag1:");
  });
  QUnit.test("headline with _*:b some #+ #! + ! <today> characters", function(assert) {
    assert.equal(nodes[12].title.trim(), "headline with _*:b some #+ #! + ! <today> characters");
    assert.equal(nodes[12].todo, "TODO");
    assert.equal(nodes[12].lvl, 1);
    assert.equal(nodes[12].pri, "A");
    assert.equal(nodes[12].tags, ":tag:");
  });
  QUnit.test("heading <2018-02-05 Mon 12:00 .+1d> with timestamp", function(assert) {
    assert.equal(nodes[13].title, "heading <2018-02-05 Mon 12:00 .+1d> with timestamp");
    assert.equal(nodes[13].todo, undefined);
    assert.equal(nodes[13].lvl, 1);
    assert.equal(nodes[13].pri, undefined);
    assert.equal(nodes[13].tags, undefined);
  });

  QUnit.test("emyty titles", function(assert) {
    assert.equal(nodes[14].title, undefined);
    assert.equal(nodes[14].todo, undefined);
    assert.equal(nodes[14].lvl, 1);
    assert.equal(nodes[14].pri, undefined);
    assert.equal(nodes[14].tags, undefined);
    assert.equal(nodes[14].text.trim(), "empty title heading");
    assert.equal(nodes[15].title, undefined);
    assert.equal(nodes[15].todo, "TODO");
    assert.equal(nodes[15].lvl, 1);
    assert.equal(nodes[15].pri, undefined);
    assert.equal(nodes[15].tags, undefined);
    assert.equal(nodes[15].text.trim(), "empty title heading with todo");
    assert.equal(nodes[16].title, undefined);
    assert.equal(nodes[16].todo, undefined);
    assert.equal(nodes[16].lvl, 1);
    assert.equal(nodes[16].pri, "A");
    assert.equal(nodes[16].tags, undefined);
    assert.equal(nodes[16].text.trim(), "empty title heading with priority");
    assert.equal(nodes[17].title, undefined);
    assert.equal(nodes[17].todo, undefined);
    assert.equal(nodes[17].lvl, 1);
    assert.equal(nodes[17].pri, undefined);
    assert.equal(nodes[17].tags, ":tag:");
    assert.equal(nodes[17].text.trim(), "empty title heading with tag");
    assert.equal(nodes[18].title, undefined);
    assert.equal(nodes[18].todo, "DONE");
    assert.equal(nodes[18].lvl, 1);
    assert.equal(nodes[18].pri, "E");
    assert.equal(nodes[18].tags, ":tag:");
    assert.equal(nodes[18].text.trim(), "empty title heading with all");
  });

  QUnit.test("no space btw todo and PRIORITY works", function(assert) {
    assert.equal(nodes[19].title.trim(), "no space btw todo and PRIORITY works");
    assert.equal(nodes[19].todo, "WAIT");
    assert.equal(nodes[19].lvl, 1);
    assert.equal(nodes[19].pri, "A");
    assert.equal(nodes[19].tags, undefined);
    assert.equal(nodes[19].text.trim(), "this node also check SEQ_TODO of the page!");
  });
  QUnit.test("no space btw PRIORITY and title works", function(assert) {
    assert.equal(nodes[20].title, "no space btw PRIORITY and title works");
    assert.equal(nodes[20].todo, undefined);
    assert.equal(nodes[20].lvl, 1);
    assert.equal(nodes[20].pri, "B");
    assert.equal(nodes[20].tags, undefined);
    assert.equal(nodes[20].text.trim(), "*nospace after star is a text of previous node");
  });

  QUnit.test("timestamp test 1", function(assert) {
    assert.equal(nodes[21].stmps.length, 1);
    assert.equal(nodes[21].stmps[0].ml, new Date(2018, 1, 5).getTime());
    assert.equal(nodes[21].stmps[0].hs, undefined);
    assert.equal(nodes[21].stmps[0].he, undefined);
    assert.equal(nodes[21].stmps[0].r, undefined);
    assert.equal(nodes[21].stmps[0].rmin, undefined);
    assert.equal(nodes[21].stmps[0].rmax, undefined);
    assert.equal(nodes[21].stmps[0].w, undefined);
    assert.equal(nodes[21].stmps[0].n, undefined);
    assert.equal(nodes[21].dl, undefined);
    assert.equal(nodes[21].sch.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[21].sch.hs, "10:00");
    assert.equal(nodes[21].sch.he, undefined);
    assert.equal(nodes[21].sch.n, undefined);
  });

  QUnit.test("timestamp test 2", function(assert) {
    assert.equal(nodes[22].dl.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[22].dl.hs, "11:00");
  });

  QUnit.test("timestamp test 3", function(assert) {
    assert.equal(nodes[23].dl.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[23].dl.hs, "11:00");
    assert.equal(nodes[23].sch.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[23].sch.hs, "10:00");
  });

  QUnit.test("timestamp test 4", function(assert) {
    assert.equal(nodes[24].dl.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[24].dl.hs, "11:00");
    assert.equal(nodes[24].sch.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[24].sch.hs, "10:00");
  });

  QUnit.test("timestamp test 5", function(assert) {
    assert.equal(nodes[25].dl, undefined);
    assert.equal(nodes[26].dl, undefined);
  });

  QUnit.test("timestamp test 6", function(assert) {
    assert.equal(nodes[27].dl.ml, new Date(2018, 1, 7).getTime());
    assert.equal(nodes[27].sch.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[27].stmps[0].ml, new Date(2018, 1, 9).getTime());
  });

  QUnit.test("timestamp test 7", function(assert) {
    assert.equal(nodes[28].sch.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[28].stmps[0].ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[28].stmps[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[29].sch.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[29].stmps[0].ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[29].stmps[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[30].sch.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[30].stmps[0].ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[30].stmps[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[30].dl.ml, new Date(2018, 1, 7).getTime());
    assert.equal(nodes[31].stmps[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[31].dl.ml, new Date(2018, 1, 7).getTime());
    assert.equal(nodes[32].sch, undefined);
    assert.equal(nodes[32].text.trim(), "SCHEDULED: <2018-02-08");
  });

  QUnit.test("timestamp test 8", function(assert) {
    assert.equal(nodes[33].stmps[0].ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[33].stmps[0].n.ml, new Date(2018, 1, 19).getTime());
  });

  QUnit.test("timestamp test 9", function(assert) {
    assert.equal(nodes[34].stmps.length, 3);
    assert.equal(nodes[35].sch.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[35].stmps[0].ml, new Date(2018, 1, 9).getTime());
  });

  QUnit.test("timestamp test 10", function(assert) {
    assert.equal(nodes[36].sch.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[36].sch.hs, "12:00");
    assert.equal(nodes[36].sch.he, "12:45");
    assert.equal(nodes[37].sch.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[37].sch.hs, "12:00");
    assert.equal(nodes[37].sch.he, undefined);
    assert.equal(nodes[37].sch.r, ".+");
    assert.equal(nodes[37].sch.rmin, "1d");
    assert.equal(nodes[38].sch.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[38].sch.hs, "12:00");
    assert.equal(nodes[38].sch.he, "13:00");
    assert.equal(nodes[38].sch.r, "++");
    assert.equal(nodes[38].sch.rmin, "2w");
    assert.equal(nodes[39].dl.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[39].dl.w, "2d");
    assert.equal(nodes[39].dl.r, undefined);
    assert.equal(nodes[39].dl.rmin, undefined);
    assert.equal(nodes[39].dl.rmax, undefined);
    assert.equal(nodes[39].dl.hs, undefined);
    assert.equal(nodes[39].dl.he, undefined);
  });

  QUnit.test("timestamp test 11", function(assert) {
    assert.equal(nodes[40].dl.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[40].dl.r, "+");
    assert.equal(nodes[40].dl.rmin, "3m");
    assert.equal(nodes[40].dl.rmax, undefined);
    assert.equal(nodes[40].dl.w, "7d");
    assert.equal(nodes[41].dl.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[41].dl.hs, "12:00");
    assert.equal(nodes[41].dl.r, "+");
    assert.equal(nodes[41].dl.rmin, "3m");
    assert.equal(nodes[41].dl.rmax, undefined);
    assert.equal(nodes[41].dl.w, "1w");
  });

  QUnit.test("timestamp test 12", function(assert) {
    assert.equal(nodes[42].sch.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[42].sch.hs, "09:10");
    assert.equal(nodes[42].sch.he, "11:00");
    assert.equal(nodes[42].sch.r, "+");
    assert.equal(nodes[42].sch.rmin, "3m");
    assert.equal(nodes[42].sch.w, "7d");
  });

  QUnit.test("timestamp test 13", function(assert) {
    assert.equal(nodes[43].sch.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[43].sch.hs, "09:10");
    assert.equal(nodes[43].sch.he, "11:00");
    assert.equal(nodes[43].sch.r, ".+");
    assert.equal(nodes[43].sch.rmin, "1d");
    assert.equal(nodes[43].sch.rmax, "2d");
    assert.equal(nodes[43].sch.w, "7d");
  });

  QUnit.test("timestamp test 14", function(assert) {
    assert.equal(nodes[44].sch.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[44].sch.hs, undefined);
    assert.equal(nodes[44].sch.he, undefined);
    assert.equal(nodes[44].sch.r, "++");
    assert.equal(nodes[44].sch.rmin, "1d");
    assert.equal(nodes[44].sch.rmax, "2d");
    assert.equal(nodes[44].sch.w, undefined);
  });

  QUnit.test("timestamp test 15", function(assert) {
    assert.equal(nodes[45].stmps[0].ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[45].stmps[0].hs, undefined);
    assert.equal(nodes[45].stmps[0].he, undefined);
    assert.equal(nodes[45].stmps[0].r, "++");
    assert.equal(nodes[45].stmps[0].rmin, "1d");
    assert.equal(nodes[45].stmps[0].rmax, "2d");
    assert.equal(nodes[45].stmps[0].w, undefined);
    assert.equal(nodes[45].stmps[0].n.ml, new Date(2018, 1, 10).getTime());
  });

  QUnit.test("timestamp test 16", function(assert) {
    assert.equal(nodes[46].istmps, undefined);
    nodes = ORG.Parser.parse("", orgfile, $.extend({}, settings, {"agenda-include-inactive-timestamps": true}));
    assert.equal(nodes[46].istmps.length, 3);
  });

  QUnit.test("unproper PROPERTY drawer", function(assert) {
    assert.equal(nodes[47].props.prop1, "1");
    assert.equal(nodes[47].props.prop2, undefined);
    assert.equal(nodes[47].stmps.length, 1);
    assert.equal(nodes[48].title.trim(), "next item");
  });

  QUnit.test("CLOSED test", function(assert) {
    let nodes = ORG.Parser.parse("test.org", "\n* closed item\nCLOSED:[2018-07-27 Fri 18:19]\n** not closed\n* improper closed\nCLOSED:[2018-01-01", settings);
    assert.ok(nodes[1].cls.ml);
    assert.equal(nodes[1].cls.hs, "18:19");
    assert.notOk(nodes[2].cls);
    assert.notOk(nodes[3].cls);
    assert.equal(nodes[3].text, "CLOSED:[2018-01-01");
  });

  QUnit.test("parsing time of a 1000 node file should be < 0.1s", function(assert) {
    var done = assert.async();
    $.get("./lib/OrgParser.test.1000nodes.org", function(orgfile) {
      let t0 = performance.now();
      ORG.Parser.parse("test.org", orgfile, settings);
      assert.lt(performance.now() - t0, 100); // not more than 0.1s/1000node
      done();
    });
  });

  QUnit.test("cases parseTimestamp should return null", function(assert) {
    assert.notOk(ORG.Parser.parseTimestamp());
    assert.notOk(ORG.Parser.parseTimestamp(null));
    assert.notOk(ORG.Parser.parseTimestamp(undefined));
    assert.notOk(ORG.Parser.parseTimestamp(""));
    assert.notOk(ORG.Parser.parseTimestamp("test"));
  });
  QUnit.test("case parseTimestamp should work", function(assert) {
    assert.equal(ORG.Parser.parseTimestamp("<2018-01-01 +1d>").ml,
      new Date(2018, 0, 1).getTime());
  });

  QUnit.test("cases parseLinks should work as expected", function(assert) {
    assert.equal(ORG.Parser.parseLinks(""), "");
    assert.equal(ORG.Parser.parseLinks("test"), "test");
    assert.equal(ORG.Parser.parseLinks("test [[link][name]] test"),
      "test <a href=\"link\">name</a> test");
    assert.equal(ORG.Parser.parseLinks("test [[link1][name1]] test[[link2][name2]]"),
      "test <a href=\"link1\">name1</a> test<a href=\"link2\">name2</a>");
  });
});

/* eslint-disable max-lines */
QUnit.module("OrgParser Tests", () => {
  const orgfile = `

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
* WAIT [#A] headline with _*:b some #+ #! + ! <today> characters  :tag:
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
#+SEQ_TODO: TODO WAIT | DONE
:PROPERTIES:
:prop1: 1
:prop2  4
:prop3: 30
* unproper logbook drawer
:LOGBOOK:
log2

* item with logs
:LOGBOOK:
log1
:END:
* unproper logbook drawer at the end
:LOGBOOK:
* body text starting with star
*body text`;
  const {parseFile, parseLinks, parseTimestamp} = ORG.Parser;
  const defaults = ORG.defaults;

  QUnit.test("null file", (assert) => {
    const _nodes = parseFile("fname", "", defaults);
    assert.equal(_nodes.FILENAME, "fname");
    assert.equal(_nodes.TEXT, "");
    assert.equal(_nodes.length, 0);
  });
  QUnit.test("empty file", (assert) => {
    const _nodes = parseFile("fname", "", defaults);
    assert.equal(_nodes.FILENAME, "fname");
    assert.equal(_nodes.CATEGORY, "fname");
    assert.equal(_nodes.TODO, defaults["todo-keywords"]);
    assert.equal(_nodes.PRIORITIES, defaults["priority-letters"]);
    assert.equal(_nodes.TEXT, "");
    assert.equal(_nodes.length, 0);
  });
  QUnit.test("text only file", (assert) => {
    const _nodes = parseFile("fname", "some text", defaults);
    assert.equal(_nodes.TEXT, "some text");
    assert.equal(_nodes.length, 0);
  });
  QUnit.test("text and heading file", (assert) => {
    const _nodes = parseFile("fname", "some defaults\n* ", defaults);
    assert.equal(_nodes.TEXT, "some defaults");
    assert.equal(_nodes.length, 1);
    assert.equal(_nodes[0].LVL, 1);
    assert.equal(_nodes[0].TITLE, "");
  });
  QUnit.test("multi-line text and heading file", (assert) => {
    const _nodes = parseFile("fname", "some defaults\nsome more defaults\n\n* ", defaults);
    assert.equal(_nodes.TEXT, "some defaults\nsome more defaults\n");
    assert.equal(_nodes.length, 1);
    assert.equal(_nodes[0].LVL, 1);
    assert.equal(_nodes[0].TITLE, "");
  });
  QUnit.test("start with heading", (assert) => {
    const _nodes = parseFile("fname", "* Heading", defaults);
    assert.equal(_nodes.length, 1);
    assert.equal(_nodes[0].TITLE, "Heading");
  });
  QUnit.test("start with empty line then heading", (assert) => {
    const _nodes = parseFile("fname", "\n* Heading", defaults);
    assert.equal(_nodes.length, 1);
    assert.equal(_nodes[0].TITLE, "Heading");
  });

  const nodes = parseFile("test.org", orgfile, defaults);
  QUnit.test("nodes length", (assert) => assert.equal(nodes.length, 51));
  QUnit.test("only title heading", (assert) => {
    assert.equal(nodes[0].TITLE, "only title heading");
    assert.notOk(nodes[0].TODO);
    assert.equal(nodes[0].LVL, 1);
    assert.notOk(nodes[0].PRI);
    assert.notOk(nodes[0].TAGS);
    assert.equal(nodes[0].TEXT.length, 0);
  });
  QUnit.test("heading with todo kwd", (assert) => {
    assert.equal(nodes[1].TITLE, "heading with todo kwd");
    assert.equal(nodes[1].TODO, "TODO");
    assert.equal(nodes[1].LVL, 2);
    assert.notOk(nodes[1].PRI);
    assert.notOk(nodes[1].TAGS);
    assert.equal(nodes[1].TEXT.length, 1);
    assert.equal(nodes[1].TEXT[0], "some text");
  });
  QUnit.test("heading with PRIORITY", (assert) => {
    assert.equal(nodes[2].TITLE.trim(), "heading with PRIORITY");
    assert.notOk(nodes[2].TODO);
    assert.equal(nodes[2].LVL, 1);
    assert.equal(nodes[2].PRI, "A");
    assert.notOk(nodes[2].TAGS);
    assert.equal(nodes[2].TEXT.length, 4);
    assert.equal(nodes[2].TEXT[0], "");
    assert.equal(nodes[2].TEXT[1], "");
    assert.equal(nodes[2].TEXT[2], "");
    assert.equal(nodes[2].TEXT[3], "");
  });
  QUnit.test("heading with two tags", (assert) => {
    assert.equal(nodes[3].TITLE, "heading with two tags");
    assert.notOk(nodes[3].TODO);
    assert.equal(nodes[3].LVL, 1);
    assert.notOk(nodes[3].PRI);
    assert.equal(nodes[3].TAGS, ":tag1:tag2:");
    assert.equal(nodes[3].TEXT.length, 0);
  });
  QUnit.test("heading with TODO and PRIORITY", (assert) => {
    assert.equal(nodes[4].TITLE.trim(), "heading with TODO and PRIORITY");
    assert.equal(nodes[4].TODO, "TODO");
    assert.equal(nodes[4].LVL, 1);
    assert.equal(nodes[4].PRI, "C");
    assert.notOk(nodes[4].TAGS);
    assert.equal(nodes[4].TEXT.length, 0);
  });
  QUnit.test("heading with TODO and three tags", (assert) => {
    assert.equal(nodes[5].TITLE, "heading with TODO and three tags");
    assert.equal(nodes[5].TODO, "TODO");
    assert.equal(nodes[5].LVL, 1);
    assert.notOk(nodes[5].PRI);
    assert.equal(nodes[5].TAGS, ":tag1:tag2:tag3:");
    assert.equal(nodes[5].TEXT.length, 2);
    assert.equal(nodes[5].TEXT[0], "text");
    assert.equal(nodes[5].TEXT[1], "some more text");
  });
  QUnit.test("heading with PRIORITY and a tag", (assert) => {
    assert.equal(nodes[6].TITLE.trim(), "heading with PRIORITY and a tag");
    assert.notOk(nodes[6].TODO);
    assert.equal(nodes[6].LVL, 1);
    assert.equal(nodes[6].PRI, "B");
    assert.equal(nodes[6].TAGS, ":tag1:");
  });
  QUnit.test("heading with TODO, PRIORITY and two tags", (assert) => {
    assert.equal(nodes[7].TITLE.trim(), "heading with TODO, PRIORITY and two tags");
    assert.equal(nodes[7].TODO, "DONE");
    assert.equal(nodes[7].LVL, 1);
    assert.equal(nodes[7].PRI, "D");
    assert.equal(nodes[7].TAGS, ":tag1:tag2:");
  });
  QUnit.test("inside title tags :tag1:tag2: shouldn't be counted, this has no tags!", (assert) => {
    assert.equal(nodes[8].TITLE, "inside title tags :tag1:tag2: shouldn't be counted, this has no tags!");
    assert.notOk(nodes[8].TODO);
    assert.equal(nodes[8].LVL, 1);
    assert.notOk(nodes[8].PRI);
    assert.notOk(nodes[8].TAGS);
  });
  QUnit.test("level 2 with TODO", (assert) => {
    assert.equal(nodes[9].TITLE, "level 2 with TODO");
    assert.equal(nodes[9].TODO, "DONE");
    assert.equal(nodes[9].LVL, 2);
    assert.notOk(nodes[9].PRI);
    assert.notOk(nodes[9].TAGS);
  });
  QUnit.test("level 3 with a tag", (assert) => {
    assert.equal(nodes[10].TITLE.trim(), "level 3 with a tag");
    assert.notOk(nodes[10].TODO);
    assert.equal(nodes[10].LVL, 3);
    assert.equal(nodes[10].PRI, "B");
    assert.equal(nodes[10].TAGS, ":tag1:");
  });
  QUnit.test("headline with _*:b some #+ #! + ! <today> characters", (assert) => {
    assert.equal(nodes[11].TITLE.trim(), "headline with _*:b some #+ #! + ! <today> characters");
    assert.equal(nodes[11].TODO, "WAIT");
    assert.equal(nodes[11].LVL, 1);
    assert.equal(nodes[11].PRI, "A");
    assert.equal(nodes[11].TAGS, ":tag:");
  });
  QUnit.test("heading <2018-02-05 Mon 12:00 .+1d> with timestamp", (assert) => {
    assert.equal(nodes[12].TITLE, "heading <2018-02-05 Mon 12:00 .+1d> with timestamp");
    assert.notOk(nodes[12].TODO);
    assert.equal(nodes[12].LVL, 1);
    assert.notOk(nodes[12].PRI);
    assert.notOk(nodes[12].TAGS);
  });

  QUnit.test("emyty title", (assert) => {
    assert.equal(nodes[13].TITLE, "");
    assert.notOk(nodes[13].TODO);
    assert.equal(nodes[13].LVL, 1);
    assert.notOk(nodes[13].PRI);
    assert.notOk(nodes[13].TAGS);
    assert.equal(nodes[13].TEXT[0], "empty title heading");
  });
  QUnit.test("emyty title with todo", (assert) => {
    assert.equal(nodes[14].TITLE, "");
    assert.equal(nodes[14].TODO, "TODO");
    assert.equal(nodes[14].LVL, 1);
    assert.notOk(nodes[14].PRI);
    assert.notOk(nodes[14].TAGS);
    assert.equal(nodes[14].TEXT[0], "empty title heading with todo");
  });
  QUnit.test("emyty title with pri", (assert) => {
    assert.equal(nodes[15].TITLE, "");
    assert.notOk(nodes[15].TODO);
    assert.equal(nodes[15].LVL, 1);
    assert.equal(nodes[15].PRI, "A");
    assert.notOk(nodes[15].TAGS);
    assert.equal(nodes[15].TEXT[0], "empty title heading with priority");
  });
  QUnit.test("emyty title with tag", (assert) => {
    assert.equal(nodes[16].TITLE, "");
    assert.notOk(nodes[16].TODO);
    assert.equal(nodes[16].LVL, 1);
    assert.notOk(nodes[16].PRI);
    assert.equal(nodes[16].TAGS, ":tag:");
    assert.equal(nodes[16].TEXT[0], "empty title heading with tag");
  });
  QUnit.test("emyty title with todo,pri,tag", (assert) => {
    assert.equal(nodes[17].TITLE, "");
    assert.equal(nodes[17].TODO, "DONE");
    assert.equal(nodes[17].LVL, 1);
    assert.equal(nodes[17].PRI, "E");
    assert.equal(nodes[17].TAGS, ":tag:");
    assert.equal(nodes[17].TEXT[0], "empty title heading with all");
  });

  QUnit.test("no space btw todo and PRIORITY works", (assert) => {
    assert.equal(nodes[18].TITLE.trim(), "no space btw todo and PRIORITY works");
    assert.equal(nodes[18].TODO, "WAIT");
    assert.equal(nodes[18].LVL, 1);
    assert.equal(nodes[18].PRI, "A");
    assert.notOk(nodes[18].TAGS);
    assert.equal(nodes[18].TEXT[0], "this node also check SEQ_TODO of the page!");
  });
  QUnit.test("no space btw PRIORITY and title works", (assert) => {
    assert.equal(nodes[19].TITLE, "no space btw PRIORITY and title works");
    assert.notOk(nodes[19].TODO);
    assert.equal(nodes[19].LVL, 1);
    assert.equal(nodes[19].PRI, "B");
    assert.notOk(nodes[19].TAGS);
    assert.equal(nodes[19].TEXT[0], "*nospace after star is a text of previous node");
  });

  QUnit.test("timestamp test 1", (assert) => {
    assert.equal(nodes[20].STMPS.length, 1);
    assert.equal(nodes[20].STMPS[0].ml, new Date(2018, 1, 5).getTime());
    assert.notOk(nodes[20].STMPS[0].hs);
    assert.notOk(nodes[20].STMPS[0].he);
    assert.notOk(nodes[20].STMPS[0].r);
    assert.notOk(nodes[20].STMPS[0].rmin);
    assert.notOk(nodes[20].STMPS[0].rmax);
    assert.notOk(nodes[20].STMPS[0].w);
    assert.notOk(nodes[20].STMPS[0].n);
    assert.notOk(nodes[20].DEADLINE);
    assert.equal(nodes[20].SCHEDULED.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[20].SCHEDULED.hs, "10:00");
    assert.notOk(nodes[20].SCHEDULED.he);
    assert.notOk(nodes[20].SCHEDULED.n);
  });
  QUnit.test("timestamp test 2", (assert) => {
    assert.equal(nodes[21].DEADLINE.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[21].DEADLINE.hs, "11:00");
  });
  QUnit.test("timestamp test 3", (assert) => {
    assert.equal(nodes[22].DEADLINE.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[22].DEADLINE.hs, "11:00");
    assert.equal(nodes[22].SCHEDULED.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[22].SCHEDULED.hs, "10:00");
  });
  QUnit.test("timestamp test 4", (assert) => {
    assert.equal(nodes[23].DEADLINE.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[23].DEADLINE.hs, "11:00");
    assert.equal(nodes[23].SCHEDULED.ml, new Date(2018, 1, 6).getTime());
    assert.equal(nodes[23].SCHEDULED.hs, "10:00");
  });
  QUnit.test("timestamp test 5", (assert) => {
    assert.notOk(nodes[24].DEADLINE);
    assert.notOk(nodes[25].DEADLINE);
  });
  QUnit.test("timestamp test 6", (assert) => {
    assert.equal(nodes[26].DEADLINE.ml, new Date(2018, 1, 7).getTime());
    assert.equal(nodes[26].SCHEDULED.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[26].STMPS[0].ml, new Date(2018, 1, 9).getTime());
  });
  QUnit.test("timestamp test 7", (assert) => {
    assert.equal(nodes[27].SCHEDULED.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[27].STMPS[0].ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[27].STMPS[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[28].SCHEDULED.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[28].STMPS[0].ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[28].STMPS[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[29].SCHEDULED.ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[29].STMPS[0].ml, new Date(2018, 1, 8).getTime());
    assert.equal(nodes[29].STMPS[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[29].DEADLINE.ml, new Date(2018, 1, 7).getTime());
    assert.equal(nodes[30].STMPS[0].n.ml, new Date(2018, 1, 10).getTime());
    assert.equal(nodes[30].DEADLINE.ml, new Date(2018, 1, 7).getTime());
    assert.notOk(nodes[31].SCHEDULED);
    assert.equal(nodes[31].TEXT[0], "SCHEDULED: <2018-02-08");
  });
  QUnit.test("timestamp test 8", (assert) => {
    assert.equal(nodes[32].STMPS[0].ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[32].STMPS[0].n.ml, new Date(2018, 1, 19).getTime());
  });
  QUnit.test("timestamp test 9", (assert) => {
    assert.equal(nodes[33].STMPS.length, 3);
    assert.equal(nodes[34].SCHEDULED.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[34].STMPS[0].ml, new Date(2018, 1, 9).getTime());
  });
  QUnit.test("timestamp test hour", (assert) => {
    assert.equal(nodes[35].SCHEDULED.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[35].SCHEDULED.hs, "12:00");
    assert.equal(nodes[35].SCHEDULED.he, "12:45");
  });
  QUnit.test("timestamp test hour, repeater .+", (assert) => {
    assert.equal(nodes[36].SCHEDULED.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[36].SCHEDULED.hs, "12:00");
    assert.notOk(nodes[36].SCHEDULED.he);
    assert.equal(nodes[36].SCHEDULED.r, ".+");
    assert.equal(nodes[36].SCHEDULED.rmin, "1d");
  });
  QUnit.test("timestamp test hour, repeater ++", (assert) => {
    assert.equal(nodes[37].SCHEDULED.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[37].SCHEDULED.hs, "12:00");
    assert.equal(nodes[37].SCHEDULED.he, "13:00");
    assert.equal(nodes[37].SCHEDULED.r, "++");
    assert.equal(nodes[37].SCHEDULED.rmin, "2w");
  });
  QUnit.test("timestamp test warning", (assert) => {
    assert.equal(nodes[38].DEADLINE.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[38].DEADLINE.w, "2d");
    assert.notOk(nodes[38].DEADLINE.r);
    assert.notOk(nodes[38].DEADLINE.rmin);
    assert.notOk(nodes[38].DEADLINE.rmax);
    assert.notOk(nodes[38].DEADLINE.hs);
    assert.notOk(nodes[38].DEADLINE.he);
  });
  QUnit.test("timestamp test 11", (assert) => {
    assert.equal(nodes[39].DEADLINE.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[39].DEADLINE.r, "+");
    assert.equal(nodes[39].DEADLINE.rmin, "3m");
    assert.notOk(nodes[39].DEADLINE.rmax);
    assert.equal(nodes[39].DEADLINE.w, "7d");
    assert.equal(nodes[40].DEADLINE.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[40].DEADLINE.hs, "12:00");
    assert.equal(nodes[40].DEADLINE.r, "+");
    assert.equal(nodes[40].DEADLINE.rmin, "3m");
    assert.notOk(nodes[40].DEADLINE.rmax);
    assert.equal(nodes[40].DEADLINE.w, "1w");
  });
  QUnit.test("timestamp test 12", (assert) => {
    assert.equal(nodes[41].SCHEDULED.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[41].SCHEDULED.hs, "09:10");
    assert.equal(nodes[41].SCHEDULED.he, "11:00");
    assert.equal(nodes[41].SCHEDULED.r, "+");
    assert.equal(nodes[41].SCHEDULED.rmin, "3m");
    assert.equal(nodes[41].SCHEDULED.w, "7d");
  });
  QUnit.test("timestamp test 13", (assert) => {
    assert.equal(nodes[42].SCHEDULED.ml, new Date(2018, 1, 9).getTime());
    assert.equal(nodes[42].SCHEDULED.hs, "09:10");
    assert.equal(nodes[42].SCHEDULED.he, "11:00");
    assert.equal(nodes[42].SCHEDULED.r, ".+");
    assert.equal(nodes[42].SCHEDULED.rmin, "1d");
    assert.equal(nodes[42].SCHEDULED.rmax, "2d");
    assert.equal(nodes[42].SCHEDULED.w, "7d");
  });
  QUnit.test("timestamp test 14", (assert) => {
    assert.equal(nodes[43].SCHEDULED.ml, new Date(2018, 1, 9).getTime());
    assert.notOk(nodes[43].SCHEDULED.hs);
    assert.notOk(nodes[43].SCHEDULED.he);
    assert.equal(nodes[43].SCHEDULED.r, "++");
    assert.equal(nodes[43].SCHEDULED.rmin, "1d");
    assert.equal(nodes[43].SCHEDULED.rmax, "2d");
    assert.notOk(nodes[43].SCHEDULED.w);
  });
  QUnit.test("timestamp test 15", (assert) => {
    assert.equal(nodes[44].STMPS[0].ml, new Date(2018, 1, 9).getTime());
    assert.notOk(nodes[44].STMPS[0].hs);
    assert.notOk(nodes[44].STMPS[0].he);
    assert.equal(nodes[44].STMPS[0].r, "++");
    assert.equal(nodes[44].STMPS[0].rmin, "1d");
    assert.equal(nodes[44].STMPS[0].rmax, "2d");
    assert.notOk(nodes[44].STMPS[0].w);
    assert.equal(nodes[44].STMPS[0].n.ml, new Date(2018, 1, 10).getTime());
  });
  QUnit.test("timestamp test 16", (assert) => {
    assert.equal(nodes[45].ISTMPS.length, 0);
    const nodes2 = parseFile("", orgfile, $.extend({}, defaults, {"agenda-include-inactive-timestamps": true}));
    assert.equal(nodes2[45].ISTMPS.length, 3);
  });

  QUnit.test("unproper drawers", (assert) => {
    assert.equal(nodes[46].PROPS.PROP1, "1");
    assert.notOk(nodes[46].PROPS.PROP2);
    assert.equal(nodes[46].PROPS.PROP3, "30");
    assert.equal(nodes[46].STMPS.length, 1);
  });
  QUnit.test("LOGBOOK drawers", (assert) => {
    assert.equal(nodes[48].TITLE.trim(), "item with logs");
    assert.equal(nodes[48].TEXT[0], ":LOGBOOK:");
    assert.equal(nodes[48].TEXT[1], "log1");
    assert.equal(nodes[48].TEXT[2], ":END:");
  });
  QUnit.test("body text starting with star", (assert) => {
    assert.equal(nodes[50].TEXT[0], "*body text");
  });
  QUnit.test("CLOSED property", (assert) => {
    const _nodes = parseFile("test.org", "\n* closed item\nCLOSED:[2018-07-27 Fri 18:19]\n** not closed\n* improper closed\nCLOSED:[2018-01-01", defaults);
    assert.ok(_nodes[0].CLOSED.ml);
    assert.equal(_nodes[0].CLOSED.hs, "18:19");
    assert.notOk(_nodes[1].CLOSED);
    assert.notOk(_nodes[2].CLOSED);
    assert.equal(_nodes[2].TEXT, "CLOSED:[2018-01-01");
  });
  QUnit.test("first line setting", (assert) => {
    const _nodes = parseFile("test.org", "#+TODO: NEW | DONE\n** NEW a heading", defaults);
    assert.equal(_nodes.TODO, "NEW | DONE");
    assert.equal(_nodes.TEXT, "#+TODO: NEW | DONE");
    assert.equal(_nodes[0].TODO, "NEW");
  });

  QUnit.test("parsing time should be at least 30k nodes/sec @i7-6700HQ", (assert) => {
    const done = assert.async();
    $.get("./OrgParser.test.1000nodes.org", (orgFileTxt) => {
      const p0 = performance.now();
      parseFile("", orgFileTxt, defaults);
      assert.ok(performance.now() - p0 <= 33.3333);
      done();
    }).fail(() => {
      assert.ok(1);
      done();
    });
  });

  QUnit.test("cases parseLinks should work as expected", (assert) => {
    assert.equal(parseLinks(""), "");
    assert.equal(parseLinks("test"), "test");
    assert.equal(parseLinks("test [[link][name]] test"), "test <a href=\"link\">name</a> test");
    assert.equal(parseLinks("test [[link1][name1]] test[[link2][name2]]"), "test <a href=\"link1\">name1</a> test<a href=\"link2\">name2</a>");
  });

  QUnit.test("empty input for parseTimestamp", (assert) => {
    assert.notOk(parseTimestamp());
    assert.notOk(parseTimestamp(""));
  });

  QUnit.test("parseTimestamp for simple input", (assert) => {
    const ts1 = parseTimestamp("<2018-02-02>");
    assert.equal(ts1.ml, 1517518800000);
    assert.equal(ts1.hs, "");
    assert.equal(ts1.he, "");
    assert.equal(ts1.r, "");
    assert.equal(ts1.rmin, "");
    assert.equal(ts1.rmax, "");
    assert.equal(ts1.w, "");
    assert.equal(ts1.n, "");
  });

  QUnit.test("parseTimestamp for complex input", (assert) => {
    const ts1 = parseTimestamp("<2018-02-02 Mon 12:05-13:10 +2d/3d -2w>");
    assert.equal(ts1.ml, 1517518800000);
    assert.equal(ts1.hs, "12:05");
    assert.equal(ts1.he, "13:10");
    assert.equal(ts1.r, "+");
    assert.equal(ts1.rmin, "2d");
    assert.equal(ts1.rmax, "3d");
    assert.equal(ts1.w, "2w");
    assert.equal(ts1.n, "");
  });
});

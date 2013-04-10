
/*
*
* tests for the SQLEngine
*
*
*/
module('SQLEngine pre-test');
var domain = 'dev.paginaswww.com';

// create engine
test('createEngine', function() {

  var e = new SQLEngine(demo_r_role, '-', domain);
  ok(e, 'SQLEngine created');
  ok(e.query, 'engine has query method ');
  ok(typeof e.query === 'function', 'e.query is type: '+(typeof e.query));
});

module('SQLEngine AJAX tests', {

  setup: function () {
    this.e = new SQLEngine(demo_r_role, '-', domain);
  }
});

// do SELECT query ajax-way
test('SQLEngine setup verification', function() {

  ok(this.e, 'engine defined');
  ok(this.dontfind === undefined, 'engine does not have "dontfind"');
});

asyncTest('ajax SELECT', 4, function() {

  this.e.query({

      q: "SELECT 1 as one",
      format: 'jsond-easy',

      callback: function (resp) {

            ok(typeof resp === 'object', 'response is object'); // 0th assert
            ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
            ok(resp.row_count[0] > 0, 'data row found');
            ok(resp.records.rows[0]['one'] === 1, 'data is '+resp.records.rows[0]['one']);
            start();
          }
    });
});


asyncTest('ajax SELECT promise', 5, function() {

  var p = this.e.query({

    q: "SELECT 1 as one",
    format: 'jsond-easy',

    callback: function (resp) {

      ok(typeof resp === 'object', 'response is object'); // 0th assert
      ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
      ok(resp.row_count[0] > 0, 'data row found');
      ok(resp.records.rows[0]['one'] === 1, 'data is '+resp.records.rows[0]['one']);
    }
  });

  p.done(function () {
    ok(true, 'promise resolved');
    start();
  });

});


asyncTest('ajax multi SELECT', 12, function() {

  this.e.query({

      q: "SELECT 1 as one",
      format: 'jsond-easy',

      callback: function (resp) {

            ok(typeof resp === 'object', 'response is object'); // 0th assert
            ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
            ok(resp.row_count[0] > 0, 'data row found');
            ok(resp.records.rows[0]['one'] === 1, 'data is '+resp.records.rows[0]['one']);
          }
    });
  this.e.query({

      q: "SELECT 2 as two",
      format: 'jsond-easy',

      callback: function (resp) {

            ok(typeof resp === 'object', 'response is object'); // 0th assert
            ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
            ok(resp.row_count[0] > 0, 'data row found');
            ok(resp.records.rows[0]['two'] === 2, 'data is not 2');
          }
    });
  this.e.query({

      q: "SELECT 3 as three",
      format: 'jsond-easy',

      callback: function (resp) {

          ok(typeof resp === 'object', 'response is object'); // 0th assert
          ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
          ok(resp.row_count[0] > 0, 'data row found');
          ok(resp.records.rows[0]['three'] === 3, 'data is not 3')
        }
    });

  // ends async test at 2 seconds.
  setTimeout(function() {
      start();
    }, 2000);
});


// test that error calls errback
asyncTest('ajax SELECT error', 1+0+1, function() {

  this.e.query({

      q: "SELECTY 1 as one",
      format: 'jsond-easy',

      errback: function(err, resp) {

          ok(true, "errback was called");
          equal(err.length, 16, "errorval: "+err);   // ProgrammingError
          start();
        },

      callback: function (resp) {
          start();
        }
    });
});


// test that error calls errback - with promise
asyncTest('ajax SELECT error - promise', 3, function() {

  var p = this.e.query({

    q: "SELECTY 1 as one",
    format: 'jsond-easy',

    errback: function(err, resp) {

      ok(true, "errback was called");
      equal(err.length, 16, "errorval: "+err);
    },

    callback: function (resp) {
      start();
    }
  });

  p.fail( function(a) {
    ok(a,'promise fail called')
    start();
  });
});


// do SELECT query by rows
asyncTest('ajax SELECT', 5, function() {

  this.e.queryRows({

      q: "SELECT 1 as one UNION SELECT 2",
      format: 'jsond-easy',

      callback: function (rows, hdr) {

          ok(typeof hdr === 'object', 'hdr param is object'); // 0th assert
          ok(typeof rows === 'object', 'hdr param is object'); // 0th assert
          ok(rows.length > 1, 'mutliple rows not found');
          ok(rows[0]['one'] === 1, 'data is '+rows[0]['one']);
          ok(rows[1]['one'] === 2, 'data is '+rows[1]['one']);
          start();
        }
    });
});


// do SELECT query by rows - with promise
asyncTest('ajax SELECT promise', 6, function() {

  var p = this.e.queryRows({

    q: "SELECT 1 as one UNION SELECT 2",
    format: 'jsond-easy',

    callback: function (rows, hdr) {

      ok(typeof hdr === 'object', 'hdr param is object'); // 0th assert
      ok(typeof rows === 'object', 'hdr param is object'); // 0th assert
      ok(rows.length > 1, 'multiple rows found');
      ok(rows[0]['one'] === 1, 'data is '+rows[0]['one']);
      ok(rows[1]['one'] === 2, 'data is '+rows[1]['one']);
    }
  });

  p.done(function(a) {
    ok(a,'promise done called');
    start();
  });
});


// use args param
//
asyncTest('use args 1', 4, function () {

  this.e.query({

    q : 'SELECT %s as one',
    format: 'jsond-easy',
    args: [1],

    callback: function (resp) {

      ok(typeof resp === 'object', 'response is object'); // 0th assert
      ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
      ok(resp.row_count[0] > 0, 'data row found');
      ok(resp.records.rows[0]['one'] === 1, 'data is not 1');
      start();
    },

    errback: function(err, resp) {

      ok(true, "errback was called");
      equal(err.length, 5, "errorval: "+err);
      start();
    }
  });

  // ends async test at 2 seconds.
  setTimeout(function() {
    start();
  }, 2000);

});


// use args param
//
asyncTest('use args 2', 5, function () {

  this.e.query({

    q : 'SELECT %s as one, %s as two',
    format: 'jsond-easy',
    args: [1, 'dos'],

    callback: function (resp) {

      ok(typeof resp === 'object', 'response is object'); // 0th assert
      ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
      ok(resp.row_count[0] > 0, 'data row found');
      ok(resp.records.rows[0]['one'] === 1, 'data is not 1');
      ok(resp.records.rows[0]['two'] === 'dos', 'data is not "dos"');
      start();
    },

    errback: function(err, resp) {

      ok(true, "errback was called");
      equal(err.length, 5, "errorval: "+err);
      start();
    }
  });

  // ends async test at 2 seconds.
  setTimeout(function() {
    start();
  }, 2000);

});


// use namedParams param
//
asyncTest('use namedParams', 5, function () {

  this.e.query({

    q : 'SELECT %(un) as one, %(der) as two',
    format: 'jsond-easy',
    namedParams: {'un':1, 'der':'dos'},

    callback: function (resp) {

      ok(typeof resp === 'object', 'response is object'); // 0th assert
      ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
      ok(resp.row_count[0] > 0, 'data row found');
      ok(resp.records.rows[0]['one'] === 1, 'data is not 1');
      ok(resp.records.rows[0]['two'] === 'dos', 'data is not "dos"');
      start();
    },
    errback: function(err, resp) {

      ok(true, "errback was called");
      equal(err.length, 5, "errorval: "+err);
      start();
    }
  });

  // ends async test at 2 seconds.
  setTimeout(function() {
    start();
  }, 2000);

});


// use namedParams Date param
//
asyncTest('use namedParams Date', 3, function () {

  var q = 'CREATE TEMP TABLE t ( t TIMESTAMP );\n'+
          'INSERT INTO t (t) VALUES (%(ts));',
      dt = new Date();

  this.e.query({

    q : q,
    format: 'jsond-easy',
    namedParams: { 'ts': dt },

    callback: function (resp) {

      ok(typeof resp === 'object', 'response is object'); // 0th assert
      ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
      ok(resp.result_sets[1].row_count[0] > 0, 'data row found');
      start();
    },

    errback: function(err, resp) {

      ok(true, 'placeholder, for 3 tests');
      ok(true, "errback was called");
      ok(err.length >= 3, "errorval: "+err);  // ajax
      start();
    }
  });

  // ends async test at 2 seconds.
  setTimeout(function() {
    start();
  }, 2000);

});


// do SELECT query form way
var form = "<form id=\"qunit_form\" method='post' enctype=\"multipart/form-data\">"+
           "<input name=\"q\" value=\"SELECT 99 AS col\" />"+
           "</form>";

module('SQLEngine Form tests', {

  setup: function () {

    this.e = new SQLEngine(demo_r_role,'-',domain);
    $('#qunit_form').remove();
    $('body').append(form);
  },

  teardown: function () {

    $('#qunit_form').remove();
    this.e = null;
    equal($('#qunit_form').length, 0, 'test form not cleaned up');
  }
});

// verify setup is ok
test('SQLEngine form setup verification', function() {

  ok(this.e, 'engine defined');
  ok(this.dontfind === undefined, 'engine does not have "dontfind"');
  equal($('#qunit_form').length, 1, 'test form appended '+$('#qunit_form').length);
});



asyncTest('form SELECT', 4+1, function() {

  var that = this;
  setTimeout(function () {
    // timeout allows for rpc iframes to be setup.

    that.e.queryByForm({

        "formId": "qunit_form",

        callback: function (resp) {

              ok(typeof resp === 'object', 'response is object'); // 0th assert
              ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
              ok(resp.row_count[0] > 0, 'data row found');
              ok(resp.records.rows[0][0] === 99, 'data is not 99: '+resp.records.rows[0]['col']);
              start();
            }
      });

    $('#qunit_form').rdbhostSubmit();
    }, 10);
});




// form select with promise
asyncTest('form SELECT promise', 5+1, function() {

  var that = this;
  setTimeout(function () {
    // timeout allows for rpc iframes to be setup.

    var p = that.e.queryByForm({

      "formId": "qunit_form",

      callback: function (resp) {

        ok(typeof resp === 'object', 'response is object'); // 0th assert
        ok(resp.status[1].toLowerCase() == 'ok', 'status is not ok: '+resp.status[1]); // 1st assert
        ok(resp.row_count[0] > 0, 'data row found');
        ok(resp.records.rows[0][0] === 99, 'data is not 99: '+resp.records.rows[0]['col']);
      }
    });

    p.done(function(a) {
      ok(a, 'promise done called');
      start();
    });

    $('#qunit_form').rdbhostSubmit();
  }, 10);
});



asyncTest('form SELECT error', 2+1, function() {

  var that = this;
  setTimeout(function () {
    // timeout allows for rpc iframes to be setup.

    $('#qunit_form input').val('SELECTY 1');

    that.e.queryByForm({

        "formId": "qunit_form",

        errback: function (err, resp) {

              console.log(err);
              console.log(resp);
              ok(typeof resp === typeof 'o', 'response is string'); // 0th assert
              ok(err.length === 16, 'error code not len 5: '+err); // 1st assert
              start();
            },
        callback: function(resp) {
              var a =1;
            }
      });

    $('#qunit_form').rdbhostSubmit();
    }, 10);
});





/*
*
*/
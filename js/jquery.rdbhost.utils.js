/*
 *  Plugin for Rdbhost, providing friendly functions for common utils
 *
 *
 */


(function ($, window) {


    $.emailWebmaster = function(opts) {

        /*
         *  to,
         *  from,
         *  subject,
         *  body,
         *  htmlBody,
         *  attachmentName,
         *  attachmentBody
         */

        var emailWMQuery =
            "SELECT %(body) AS body,                                    \n"+
            "       %(htmlbody) AS htmlbody,                            \n"+
            "       api.webmaster_email AS \"To:\",                     \n"+
            "       api.account_email AS \"From:\",                     \n"+
//            "       %(from) AS \"From:\",                               \n"+
            "       %(subject) AS \"Subject:\",                         \n"+
            "       api.apikey AS apikey,                               \n"+
            "       'postmark' AS service,                              \n"+
            "       1 AS idx                                            \n"+
            "  FROM auth.apis AS api WHERE service = 'postmark'     \n"+
            "LIMIT 1                                                      ";

        return $.postData({

            userName:   'preauth',

            q:          emailWMQuery,
            kw:         'emailWebmaster',
            mode:       'email',

            namedParams:  {
                body: opts.bodyString || '',
                htmlbody: opts.htmlBodyString || '',
                from: opts.from,
                subject: opts.subject
            }

/*
            callback: function(resp) {
                return resp;
            },

            errback: function(err, errmsg) {
                return arguments;
            }
*/
        });
    };


    /*
     * Email group of users, content from
     */
    $.emailAllUsers = function(opts) {

      /*
       *
       */
        var emailAUQuery =
            "SELECT replace(emails.body,'~recip',oid.identifier) AS body,  \n"+  // interpolate email addy
            "       replace(emails.htmlbody,'~recip',                      \n"+  // into bodies
            "                           oid.identifier)  AS htmlbody,      \n"+
            "       oid.identifier AS \"To:\",                             \n"+
            "       api.account_email AS \"From:\",                        \n"+
            "       emails.subject AS \"Subject:\",                        \n"+
            "       api.apikey AS apikey,                                  \n"+
            "       'postmark' AS service,                                 \n"+
            "       1 AS idx                                               \n"+
            "  FROM auth.apis AS api,                                      \n"+
            "       auth.openid_accounts AS oid,                           \n"+
            "       emails                                                 \n"+
            " WHERE api.service = 'postmark'                               \n"+
            "   AND emails.id = %(emailid)                                 \n"+
            "   AND oid.identifier LIKE \'%%@%%\'                          \n";  // exclude non-email identifiers


        return $.postData({

            userName:   'preauth',

            q:          emailAUQuery,
            kw:         'emailAllUsers',
            mode:       'email',

            namedParams:  {
                emailid: opts.emailid
            }

/*
            callback: function(resp) {
                return resp;
            },

            errback: function(err, errmsg) {
                return arguments;
            }
*/
        });
    };


    $.setupEmail = function(opts) {

        /*
         * service,
         * apikey,
         * webmasterEmail,
         * accountEmail,
         * callback
         * errback
         *
         */

        var qCreateAuthSchema =
             'CREATE SCHEMA "auth";                                     ',

            qGrantAuthSchemaPrivs =
             'GRANT USAGE ON SCHEMA "auth" TO %s                        ',

            qCreateAPITable =
             'CREATE TABLE "auth"."apis" (                            \n'+
             '  service VARCHAR(10) NOT NULL,                         \n'+
             '  apikey VARCHAR(100) NOT NULL,                         \n'+
             '  webmaster_email VARCHAR(150) NULL,                    \n'+
             '  account_email VARCHAR(150) NOT NULL                   \n'+
             ');                                                        ',

            qCreateEmailBodyTable =
             'CREATE TABLE "emails" (                                 \n'+
             '  id VARCHAR(75),                                       \n'+
             '  subject VARCHAR(150),                                 \n'+
             '  body TEXT,                                            \n'+
             '  htmlbody TEXT                                         \n'+
             ');                                                      \n',

            qInsert =
             'INSERT INTO "auth"."apis"                               \n'+
             '  ( service, apikey, webmaster_email, account_email )   \n'+
             'VALUES(%(service),%(apikey),%(webmaster),%(acctemail));   ';


        function createAuthSchema() {

            var p = $.superPostData({

                userName:    opts.userName,
                q:           qCreateAuthSchema
            }).fail(function(errArray) {

                console.log('createAuthSchema fail '+errArray);
                return errArray;
            }).done(function(resp) {

                console.log('createAuthSchema success ');
                return resp;
            });
        }

        function grantSchemaPrivs() {

            var uName = $.role().replace('s','p');
            var q = qGrantAuthSchemaPrivs.replace('%s',uName);
            return $.superPostData({

                userName: opts.userName,
                q: q
            }).fail(function(errArray) {

                console.log('grantAuth error '+errArray+' '+q);
                return errArray;
            }).done(function(resp) {

                console.log('grantAuth success '+q);
                return resp;
            })
        }

        function createAPITable() {

            return $.superPostData({

                userName: opts.userName,
                q:        qCreateAPITable
            })
        }

        function qInsertFunc() {

            return $.superPostData({

                userName:    opts.userName,
                q:           qInsert,

                namedParams: {
                    service: opts.service,
                    apikey: opts.apikey,
                    webmaster: opts.webmaster,
                    acctemail: opts.acctemail
                }
            })
        }

        var p = $.Deferred();
        function casStep() {
            console.log('begin: createAuthSchema');
            return createAuthSchema()
                .fail(function(err) {
                    console.log('createAuthSchema err '+err);
                    return err;
                }).done(function(resp) {
                    console.log('createAuthSchema done');
                    return resp;
                });
        }
        function gspStep() {

            console.log('begin: grantSchemaPrivs');
            return grantSchemaPrivs()
                .fail(function(err) {
                    console.log('grantSchemaPrivs err '+err);
                    return err;
                }).done(function(resp) {
                    console.log('grantSchemaPrivs done');
                    return resp;
                });
        }
        function catStep() {
            console.log('begin: createAPITable');
            return createAPITable()
                .fail(function(err) {
                    console.log('createAPITable err '+err);
                    return err;
                }).done(function(resp) {
                    console.log('createAPITable done');
                    return resp;
                });
        }
        function qifStep() {
           console.log('begin: qInsertFunc');
           return qInsertFunc()
               .fail(function(err) {
                   console.log('qInsertFunc err '+err);
                   return err;
               }).done(function(resp) {
                   console.log('qInsertFunc done');
                   return resp;
               });
        }
        var p2 = p.then(casStep, casStep)
            .then(gspStep, gspStep)
            .then(catStep, catStep)
            .then(qifStep, qifStep);
        p.resolve();

        return p2;
    };



    $.chargeCard = function(opts) {

        /*
         *  cardNum,
         *  ccv,
         *  Name,
         *  Amount,
         *  acctId,
         *
         *  callback
         *  errback
         */

        var chargeQuery =
            "SELECT apis.apikey AS apikey,                                          \n"+
            "    'stripe' AS service,                                               \n"+
            "    'charge' AS action,                                                \n"+
            "    %(amount) AS amount,                                               \n"+
            "    %(ccnum) AS cc_num,                                                \n"+
            "    %(cvc) AS cc_cvc,                                                  \n"+
            "    %(expmon) AS cc_exp_mon,                                           \n"+
            "    %(name) AS name,                                                   \n" +
            "    %(expyr) AS cc_exp_yr,                                             \n"+
            "    'usd' AS currency,                                                 \n"+
            "    %(identifier) AS idx,                                              \n"+
            "    'INSERT INTO \"charges\" (payer, amount, transid)                  \n"+
            "         VALUES({idx},{amount},{id})'       AS postcall,               \n"+
            "    'INSERT INTO \"badcharges\" (payer, amount, error)                 \n"+
            "         VALUES({idx},{amount},{error})'     AS errcall                \n"+
            " FROM auth.apis AS apis                                                \n"+
            "WHERE apis.service = 'stripe'                                            ";


        return $.postData({

          userName:   'preauth',

          q:          chargeQuery,
          kw:         'chargeCard',
          mode:       'charge',

          namedParams:  {
            amount: Math.round(opts.amount*100), // cents
            ccnum: opts.cc_num,
            cvc: opts.cc_cvc,
            expmon: opts.exp_mon,
            expyr: opts.exp_yr,
            name: opts.cardholder,
            identifier: 'me@here',
            note: 'note'
          }

/*
          callback: function(resp) {
            return resp;
          },

          errback: function(err, errmsg) {
            return arguments;
          }
*/
        });
    };



    $.setupCharge = function(opts) {

        /*
         *  service,
         *  apikey,
         *
         *  callback,
         *  errback
         *
         */

      var qCreateAPITable =
              'CREATE TABLE "auth"."apis" (                            \n'+
              '  service VARCHAR(10) NOT NULL,                         \n'+
              '  apikey VARCHAR(100) NOT NULL,                         \n'+
              '  webmaster_email VARCHAR(150) NULL,                    \n'+
              '  account_email VARCHAR(150) NOT NULL                   \n'+
              ');                                                        ',

          qCreateChargeResultsTables =
              'CREATE TABLE "charges" (                                \n'+
              '  id VARCHAR(75),                                       \n'+
              '  amount NUMERIC(6,2),                                  \n'+
              '  payer TEXT,                                           \n'+
              '  note TEXT                                             \n'+
              ');                                                      \n'+
              'CREATE TABLE "badcharges" (                             \n'+
              '  id VARCHAR(75),                                       \n'+
              '  amount NUMERIC(6,2),                                  \n'+
              '  error TEXT,                                           \n'+
              '  payer TEXT,                                           \n'+
              '  note TEXT                                             \n'+
              ');                                                      \n',

          qInsert =
              'INSERT INTO "auth"."apis"                               \n'+
              '  ( service, apikey, webmaster_email, account_email )   \n'+
              'VALUES(%(service),%(apikey),%(webmaster),%(acctemail));   ';


      var p = $.superPostData({

        userName: opts.userName,
        q:        qCreateAPITable
      });

      return p.finally(function() {

          var p1 = $.superPostData({

            userName:    opts.userName,
            q:           qInsert,

            namedParams: {
              service: opts.service,
              apikey: opts.apikey,
              webmaster: '',
              acctemail: opts.accountEmail
            }
          });

          var p2 = $.superPostData({

            userName:    opts.userName,
            q:           qCreateChargeResultsTables
          })
      });

    };


    /*
     * superLogin - logs into server using email and password; returns object like:
     *    { 'preauth': [ 'p0000000002', '' ], 'super': [ 's0000000002', '?????..??' ] }
     */
    $.superLogin = function(opts) {

        /*
         * email,
         * password,
         * acctId,
         *
         * callback,
         * errback
         */

        function _callback (json) {

            var rType = { 'r': 'read', 's': 'super', 'p': 'preauth', 'a': 'auth' };

            var hash = {},
                rowCt = json.row_count[0],
                rows = rowCt ? json.records.rows : [];

            for ( var r in rows ) {

                if ( rows.hasOwnProperty(r) ) {
                    var row = rows[r],
                        roleType = rType[row['role'].substring(0,1).toLowerCase()];
                    hash[roleType] = [ row['role'], row['authcode'] === '-'? '' : row['authcode'] ];
                }
            }

            if ( savedCallback )
                return savedCallback(hash);
            else
                return hash;
        }
        var savedCallback = opts.callback;
        opts.callback = _callback;

        return $.loginAjax(opts);
    };

    var superAuthcode = null,
        superAuthcodeTimer = null,
        acctEmail = null;

    $.superPostData = function(opts) {

        /*
         * same as postData
         *   if no authcode, logs in to get super authcode
         *   sets timeout to clear authcode
         */

        if ( superAuthcode ) {

            opts['authcode'] = superAuthcode;
            return $.postData(opts);
        }
        else {
            var def = $.Deferred();

            function doIt(h) {

                return $.superLogin({

                    email: h.email,
                    password: h.password,

                    callback: function(res) {
                        clearTimeout(superAuthcodeTimer);
                        superAuthcode = res.super[1];
                        superAuthcodeTimer = setTimeout(function() { superAuthcode = null; }, 8000);
                        return $.superPostData(opts);
                    },

                    errback: opts.errback
                })
            }

            def.then(doIt);

            drawLoginDialog('test title', opts.email, function(h) { def.resolve(h) });

            return def.promise();
        }
    };


    $.superPostFormData = function(formId, opts) {

        /*
         * same as postFormData
         */

        if ( superAuthcode ) {

            opts['authcode'] = superAuthcode;
            return $.postFormData(formId, opts);
        }
        else {

            var def = $.Deferred();

            function doIt(h) {

                return $.superLogin({

                    email: h.email,
                    password: h.password,
                    userName: opts.userName,

                    callback: function(res) {

                        clearTimeout(superAuthcodeTimer);
                        superAuthcode = res.super[1];
                        superAuthcodeTimer = setTimeout(function() {
                            superAuthcode = null;
                        }, 8000);
                        return $.superPostFormData(formId, opts);
                    },

                    errback: opts.errback
                })
            }

            def.then(doIt);

            drawLoginDialog('test title', opts.email, function(h) { def.resolve(h) });

            return def.promise();
        }
    };


    $.preauthPostData = function(opts) {

        /*
         * same as postData
         *   if get error...
         */

        // todo - implement after server upgrade, for timed-out

    };


    $.preauthPostFormData = function(opts) {

        /*
         * same as postData
         *   if get error...
         */

        // todo - implement after server upgrade, for timed-out training sessions

    };


    function drawLoginDialog(title, email, onSubmit, onCancel) {

        var $liDialog, hgt = 100, width = 200;

        $liDialog = $('<div id="rdbhost-super-login-form"><form>                    '+
                      '  <span id="title">t </span> <a href="" class="cancel">x</a>         ' +
                      '    <br />                                                           ' +
                      '    <input name="email" type="text" placeholder="email"/>            ' +
                      '    <input name="password" type="password" placeholder="password" /> ' +
                      '    <input type="submit" />                                          ' +
                      '</form></div>                                                        ');

        $liDialog.css({

            'position': 'absolute',
            'width': width + 'px',
            'height': hgt + 'px',
            'margin-top': Math.round(hgt/-2) + 'px',
            'margin-right': '0',
            'margin-bottom': '0',
            'margin-left': Math.round(width/-2) + 'px',
            'left': '50%',
            'top': '50%',
            'display': 'none',
            'z-index': 10,
            'background': '#dacba2',
            'padding': '12px',
            'border': 'solid #850e45 8px'
        });
        $liDialog.find('span').css({

            'font-size': 'larger',
            'color': '#850e45'
        });
        $liDialog.find('input').css({

            'color': '#850e45'
        });

        $liDialog.find('a').css('float', 'right');
        $liDialog.find('#title').text(title);

        $('body').append($liDialog);
        $liDialog.show();

        $liDialog.on('submit', function(ev) {

            var h = {};
            h.email = $('#email').val();
            h.passwd = $('#password').val();

            $liDialog.remove();
            onSubmit(h);
            return false;
        });

        $liDialog.find('a').on('click', function(ev) {

            var h = {};
            h.email = $('#email').val();
            h.passwd = $('#password').val();

            $liDialog.remove();
            if ( onCancel )
                onCancel(h);
            return false;
        })
    }

    $.drawLoginDialog = drawLoginDialog;

}(jQuery, window));


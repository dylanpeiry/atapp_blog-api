var express = require('express');
var router = express.Router();
var con = require('../db/db.js');
let dateTime = require('node-datetime');
let sha1 = require('sha1');


/* GET users listing. */
router.get('/', function (req, resp, next) {
    con.query('SELECT user_id,username,firstName,name,mail,phone,user_registered,isBanned,isPasswordReset,ROLES_role_id FROM users', function (err, resu) {
        if (err) throw err;
        resp.setHeader('Content-Type', 'application/json');
        resp.send(JSON.stringify(resu));
    })
});

/* GET specific user */
router.get('/:id', function (req, resp, next) {
    con.query('SELECT * FROM users WHERE user_id = ?', [req.params.id], function (err, resu) {
        if (err) throw err;
        resp.setHeader('Content-Type', 'application/json');
        if (resu.length === 0)
            resp.send(JSON.stringify({'user_found': false}));
        else
            resp.send(JSON.stringify({'user_found': true, 'user': resu[0]}));
    })
})

/* GET check if username exists */
router.get('/get/usernames/:username', function (req, resp, next) {
    con.query('SELECT * FROM users WHERE username = ?', [req.params.username], function (err, resu) {
        if (err) throw err;
        resp.setHeader('Content-Type', 'application/json');
        if (resu.length === 0) {
            resp.send(JSON.stringify({'username_found': false}));
        }
        else {
            resp.send(JSON.stringify({'username_found': true}));
        }
    })
})

/* GET all usernames */
router.get('/get/usernames', function (req, resp, next) {
    con.query('SELECT username FROM users', [], function (err, resu) {
        if (err) throw err;
        resp.setHeader('Content-Type', 'application/json');
        if (resu.length === 0) {
            resp.send(JSON.stringify({'usernames_found': false}));
        } else {
            resp.send(JSON.stringify({'usernames_found': true, 'usernames': resu}));
        }
    })
})

/* GET check if a specific mail already exists */
router.get('/get/mails/:mail', function (req, resp, next) {
    con.query('SELECT * FROM users WHERE mail = ?', [req.params.mail], function (err, resu) {
        if (err) throw err;
        resp.setHeader('Content-Type', 'application/json');
        if (resu.length === 0) {
            resp.send(JSON.stringify({'mail_found': false}));
        } else {
            resp.send(JSON.stringify({'mail_found': true}));
        }
    })
})

/* GET get all users mails */
router.get('/get/mails', function (req, resp, next) {
    con.query('SELECT mail FROM users', [], function (err, resu) {
        if (err) throw err;
        resp.setHeader('Content-Type', 'application/json');
        if (resu.length === 0) {
            resp.send(JSON.stringify({'mails_found': false}));
        } else {
            resp.send(JSON.stringify({'mails_found': true, 'mails': resu}));
        }
    })
})

/* POST new user */
router.post('/', function (req, resp, next) {
    let dt = dateTime.create();
    let now = dt.format('Y-m-d');
    let user = req.body;
    con.query('INSERT INTO users (username,firstName,name,mail,password,user_registered) VALUES (?,?,?,?,?,?)', [user.username, user.firstName, user.lastName, user.mail, sha1(user.password), now], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu === undefined) {
            resp.send(JSON.stringify({'registration_completed': false}))
        } else if (resu.affectedRows > 0) {
            resp.send(JSON.stringify({'registration_completed': true}));
        }
    })
})

module.exports = router;

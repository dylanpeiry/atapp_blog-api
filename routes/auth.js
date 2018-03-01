let express = require('express');
let router = express.Router();
let con = require('../db/db.js');
let sha1 = require('sha1');

/* POST auth listing. */
router.post('/', function (req, resp, next) {
    let user = req.body;
    con.query('SELECT * FROM users WHERE username = ? AND password = ?', [user.username, sha1(user.password)], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu[0] === undefined)
            resp.send(JSON.stringify({'auth_authorized': false}))
        else
            resp.send(JSON.stringify({'auth_authorized': true, 'user': resu[0]}));
    });
});

router.get('/',function (req, resp, next) {
    resp.send("Unauthorized access");
})

module.exports = router;

let express = require('express');
let router = express.Router();
let con = require('../db/db.js');

/* GET */
router.get('/', function (req, resp, next) {
    con.query('SELECT * FROM categories', [], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        resp.send(JSON.stringify({'categories': resu}));
    })
});

router.get('/:cat', function (req, resp, next) {
    let cat = req.params.cat;
    con.query('SELECT category_id FROM categories WHERE category_name = ?', [cat], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu.length > 0) {
            resp.send(JSON.stringify({'category_exists': true, 'id': resu[0].category_id}))
        } else {
            resp.send(JSON.stringify({'category_exists': false}))
        }
        console.log(resu);
    })
})
router.post('/', function (req, resp, next) {
    let cat = req.body;
    con.query('INSERT INTO categories (category_name,category_approved) VALUES (?,0)', [cat.category_name], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu.affectedRows > 0) {
            resp.send(JSON.stringify({'category_added': true, 'id': resu.insertId}));
        } else {
            resp.send(JSON.stringify({'category_added': false}));
        }
    })
})

module.exports = router;

let express = require('express');
let router = express.Router();
let con = require('../db/db.js');
const EventEmitter = require('events').EventEmitter;
const events = new EventEmitter();

/* POST */
router.post('/', function (req, resp, next) {
    console.log(req.body);
    resp.send("post rte");
});

router.get('/',function (req,resp,next){
    console.log(req.query);
    resp.send("get rte");
})

module.exports = router;

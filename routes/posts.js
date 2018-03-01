let express = require('express');
let router = express.Router();
let con = require('../db/db.js');
const EventEmitter = require('events').EventEmitter;
const events = new EventEmitter();

/* Events listeners */
events.on('insert_categories_posts', function (data) {
    console.log(data);
    con.query('INSERT INTO posts_has_categories (POSTS_post_id,CATEGORIES_category_id) VALUES ?', [data], function (err, resu) {
        console.log(resu);
        // On lie les catégories au post dans la table posts_has_categories
    })
});


/* POST */
router.post('/', function (req, resp, next) {
    let post = req.body;
    con.query('INSERT INTO posts (title,content,post_date,USERS_user_id,IMAGES_image_id) VALUES (?,?,?,?,1)', [post.title, post.content, post.date, post.user_id/*, post.image_id*/], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu === undefined)
            resp.send(JSON.stringify({'post_added': false}));
        else if (resu.affectedRows === 1) {
            let lastId = resu.insertId;
            con.query('SELECT * FROM posts WHERE post_id = ?', [lastId], function (err, resu) {
                resp.send(JSON.stringify({'post_added': true, 'post': resu}));
            })
        }
    })
});

/* UPDATE post */
router.put('/:id', function (req, resp, next) {
    let newPost = req.body;
    let id = req.params.id;
    con.query('UPDATE posts SET title = ?,content = ?,updated_at = ? WHERE post_id = ? ', [newPost.title, newPost.content, newPost.updated_at, id], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu === undefined)
            resp.send(JSON.stringify({'post_updated': false}));
        else if (resu.affectedRows === 1) {
            resp.send(JSON.stringify({'post_updated': true}));
        }
    })
})

/* GET all posts */
router.get('/', function (req, resp, next) {
    let posts = [];
    con.query('SELECT * FROM posts ORDER BY post_id DESC', function (err, resu) {
        for (let i = 0; i < resu.length; i++) {
            con.query('SELECT DISTINCT categories.category_id,categories.category_name,categories.category_approved FROM posts,categories,posts_has_categories phc WHERE phc.POSTS_post_id = ? AND phc.CATEGORIES_category_id = categories.category_id', [resu[i].post_id], function (err2, resu2) {
                let cat = resu2;
                let post = resu[i];
                post.Categories = cat;
                posts.push(post);
                if (i === resu.length - 1) {
                    resp.setHeader('Content-Type', 'application/json');
                    resp.send(JSON.stringify(posts));
                }
            });
        }
    })
})

/* GET specific post by id */
router.get('/:id', function (req, resp, next) {
    con.query('SELECT * FROM posts WHERE post_id = ?', [req.params.id], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu[0] === undefined)
            resp.send(JSON.stringify({'post_found': false}));
        else
            resp.send(JSON.stringify({'post_found': true, 'post': resu[0]}));
    })
})

/* GET categories of the specified post */
router.get('/:id/categories', function (req, resp, next) {
    con.query('SELECT DISTINCT categories.category_id,categories.category_name,categories.category_approved FROM posts,categories,posts_has_categories phc WHERE phc.POSTS_post_id = ? AND phc.CATEGORIES_category_id = categories.category_id', [req.params.id], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu.length < 1)
            resp.send(JSON.stringify({'categories_found': false}));
        else
            resp.send(JSON.stringify({'categories_found': true, 'categories': resu}));
    })
})

/* REMOVE categories of a post */
router.delete('/:id/categories', function (req, resp, next) {
    let post_id = req.params.id;
    let query = req.query.ids;
    let ids = query.split(',');
    con.query('DELETE FROM posts_has_categories WHERE POSTS_post_id = ? AND CATEGORIES_category_id IN (?)', [post_id, ids], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu.affectedRows > 0) {
            resp.send(JSON.stringify({'categories_removed': true}));
        } else {
            resp.send(JSON.stringify({'categories_removed': false}));
        }
    });
})

/* ADD categories for a post */
router.post('/:id/categories', function (req, resp, next) {

    let post_id = req.params.id; // On récupère l'id du poste passé en url
    let query = req.query.names; // On récupère les noms à ajouter passé dans le paramètre ?names=
    let names = query.split(','); // On y stocke dans un tableau
    let add = [];
    let insert = [];
    /**
     * On commence par regarder si les catégories qu'on veut ajouter existent deja ou pas
     */
    con.query('SELECT category_id,category_name FROM categories WHERE category_name in (?)', [names], function (err, resu) {
        // Si c'est le cas, on ajoute les ids de celle ci dans le tableau insert qui contiendra tous les id à inserer pour le post
        for (r of resu) {
            insert.push([post_id, r.category_id]);
            names.splice(names.indexOf(r.category_name), 1); // On supprime les noms du tabeau des categories à insérer
        }
        for (n of names) {
            if (n !== '')
                add.push([n]); // On remplit le tableau "add" avec les catégories qui n'existent pas encore dans la bdd
        }
        /**
         * On insère toutes les catégories qui n'existent pas déjà, cela permet d'éviter les doublons
         */
        if (add.length > 0) {
            con.query('INSERT INTO categories (category_name) VALUES ?', [add], function (err, resu) {
                console.log(resu);
                if (resu !== undefined) {
                    // On recupere le dernier id inséré, compte le nombre d'items ajoutés et on ajoute les ids correspondants dans le tableau insert
                    let nbAdded = add.length;
                    let lastId = resu.insertId;
                    let firstId = lastId + nbAdded;
                    for (let i = lastId; i < firstId; i++) {
                        insert.push([post_id, i]);
                    }
                    console.log(insert.sort());
                    events.emit('insert_categories_posts', insert);
                }
            })
        } else {
            events.emit('insert_categories_posts', insert);
        }
    })

})

router.get('/status/:status', function (req, resp, next) {
    let status;
    switch (req.params.status) {
        case 'pending':
            status = "En attente";
            break;
        case 'declined':
            status = "Refusé";
            break;
        case 'accepted':
            status = "Accepté";
            break;
    }
    con.query('SELECT * FROM posts WHERE status = ?', [status], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu[0] === undefined)
            resp.send(JSON.stringify({'found': false}));
        else
            resp.send(JSON.stringify({'found': true, 'posts': resu}));
    })
})

/* DELETE post by id */
router.delete('/:id', function (req, resp, next) {
    con.query('DELETE FROM posts WHERE post_id = ?', [req.params.id], function (err, resu) {
        resp.setHeader('Content-Type', 'application/json');
        if (resu === undefined)
            resp.send(JSON.stringify({'post_deleted': false}));
        else if (resu.affectedRows === 1)
            resp.send(JSON.stringify({'post_deleted': true}));
    })
})

module.exports = router;

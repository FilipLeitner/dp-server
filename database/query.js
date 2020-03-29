const express = require("express");
const router = express.Router();
const db = require("../database/index");

router.post("/getlist", (req, res) => {
    db.any('SELECT * FROM schedules WHERE email = $1', [req.body.user])
        .then(function (data) {
            // success;
            console.log(data)
            if (data.length > 0) {
                res.json({ data });
            }
            else {
                res.send('No scheduled jobs avaliable for you');
            }
        })
        .catch(function (error) {
            // error;
            res.json({
                error
            });
        });

});

module.exports = router;

const express = require("express");
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../database/index");

function validUser(user) {
  const validEmail =
    typeof user.email == "string" &&
    user.email.trim() != "" &&
    user.email.includes("@");
  const validPassword =
    typeof user.password == "string" &&
    user.password.length > 6 &&
    user.password.trim() != "";
  return validEmail && validPassword;
}

function existsEmail(email) {
  return db.oneOrNone('SELECT * FROM users WHERE email = $1 LIMIT 1', email, a => !!a);
}

//router paths auth/*
router.get("/", (req, res) => {
  res.json({
    message: "hi"
  });
});

router.post("/signup", (req, res, next) => {
  if (validUser(req.body)) {
    existsEmail(req.body.email)
      .then(exists => {
        if (exists == false) {
          bcrypt.hash(req.body.password, 10) //saltRounds
            .then(function (hash) {
              db.one(
                "INSERT INTO users(email, password,phone_number,user_type,created_at) VALUES($/email/,$/password/, $/phone_number/,$/user_type/,$/created_at/) RETURNING email",
                {
                  email: req.body.email,
                  password: hash,
                  phone_number: req.body.phone_number || null,
                  user_type: req.body.userType || 0,
                  created_at: new Date()
                }
              )
                .then(data => {
                  console.log("User added:", data.email); // print new user id;
                  res.send("User added");
                })
                .catch(error => {
                  //Error while adding to DB
                  res.json({ "ERROR:": error });
                });

            })
            .catch(error => {
              res.json({ "ERROR:": error });
            });
        }
        else {
          res.json({ message: "Email already taken" });
        }
      })
      .catch(error => {
        //pg-promise rejection (Most likely multiple rows are returned)
        res.json({ message: error });
      });

  } else {
    //login user input not valid 
    res.json({ message: "Invalid user input " });
  }
});

router.post("/login", (req, res, next) => {
  if (validUser(req.body)) {

    //checks wether user exists
    db.one(
      "SELECT * FROM users WHERE email=$/email/",
      {
        email: req.body.email,
      }
    )
      .then(user => {
        //compare password
        bcrypt.compare(req.body.password, user.password)
          .then(function (result) {
            if (result) {
              res.json({
                message: "Logged in",
                user: user.email
              });

            }
            else {
              //pw input was not matched with pw in database
              res.json({
                message: "Invalid password",
                result
              });

            }

          });
      })
      .catch(error => {
        //login user input not valid 
        res.json({
          message: "Invalid username or password",
          name: error.name,
          code: error.code
        });
      });

  } else {
    //user doesnt exists 
    res.json({ message: "Invalid user input " });
  }
});

module.exports = router;

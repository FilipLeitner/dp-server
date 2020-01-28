const express = require("express");
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

//router paths auth/*
router.get("/", (req, res) => {
  res.json({
    message: "hi"
  });
});

router.post("/signup", (req, res, next) => {
  if (validUser(req.body)) {
    console.log(db.connect);
    db.one(
      "INSERT INTO users(email, password) VALUES($/email/, $/password/) RETURNING email",
      {
        email: req.body.email,
        password: req.body.password
      }
    )
      .then(data => {
        console.log("User added:", data.email); // print new user id;
        res.send("User added");
      })
      .catch(error => {
        res.json({ "ERROR:": error.detail });
      });
  } else {
    //error
    res.json({ message: "Invalid user input " });
  }
});

router.post("/login", (req, res, next) => {
  if (validUser(req.body)) {
    db.one(
      "SELECT email FROM users WHERE email=$/email/ AND password = $/password/",
      {
        email: req.body.email,
        password: req.body.password
      }
    )
      .then(data => {
        res.send(data);
      })
      .catch(error => {
        res.json({
          message: "Invalid username or password",
          name: error.name,
          code: error.code
        });
      });
  } else {
    //error
    res.json({ message: "Invalid user input " });
  }
});

module.exports = router;

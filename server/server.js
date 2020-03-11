//require dependencies
const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
var schedule = require("node-schedule");

//require modules
var sentinel = require("./sentinel");
var scheduler = require("./schedule");
var auth = require("../auth/index");
var db = require("../database/index");

//initiate server
const app = express();
app.use(bodyParser.json());
app.use("/auth", auth);

//middleware callback
//makes weather information call
var weatherCall = async function (req, res, next) {
  console.log(req);
  try {
    // console.log(req.body)
    let lat = req.body[0];
    let long = req.body[1];
    rp(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=0b0d0e3907c63bed7455a34088b44fae`,
      { json: true }
    )
      .then(function (res) {
        req.weather = res;
        next();
      })
      .catch(function (err) {
        next(err);
      });
  } catch (err) {
    next(err);
  }
};

//API route
app.post("/api/overpass", sentinel.sentinelHandler, function (req, res) {
  try {
    res.send(req.overpasses);
  } catch {
    res.send(err);
  }
});

app.post("/api/scheduler", function (req, res) {
  try {
    scheduler.scheduler(req).then((response) => {
      res.json({
        message: response
      })
    });
  } catch {
    res.send(err);
  }
});

//run server on port:3000
app.listen(3000, () => {
  console.log("Listening on port 3000");
});

//0b0d0e3907c63bed7455a34088b44fae

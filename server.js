//require dependencies
const express = require("express");
const bodyParser = require("body-parser");
const rp = require("request-promise");
var schedule = require("node-schedule");

//require modules
var sentinel = require("./sentinel/sentinel");
var scheduler = require("./scheduler/schedule");
var auth = require("./auth/index");
var db = require("./database/index");
var dbquery = require("./database/query");
var init = require('./Init/init');


//initiate server
const app = express();
app.use(bodyParser.json());
app.use("/auth", auth);
app.use("/db", dbquery);
app.use(express.static('static'))

//API route

app.post("/api/overpass", sentinel.sentinelHandler, function (req, res) {
  try {
    res.send(req.overpasses);
  } catch (err) {
    res.send(err);
  }
});

app.post("/api/scheduler", function (req, res) {
  try {
    console.log('server', scheduler)
    scheduler.scheduler(req).then((response) => {
      console.log(response)
      res.json({
        message: response.message || response,
        code: response.code || 99
      })
    });
  } catch
  (err) {
    res.send(err);
  }

});

//run server on port:5557
app.listen(5557, () => {
  console.log("Listening on port 5557");
  init.restartSchedules();
});
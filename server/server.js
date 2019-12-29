//require dependencies
const express = require('express');
const bodyParser = require('body-parser');
const rp = require("request-promise");
var schedule = require('node-schedule');
var sentinel = require('./sentinel');

//initiate server
const app = express();
app.use(bodyParser.json());
//middleware callback
//makes weather information call
var weatherCall = async function  (req, res,next){
  console.log(req)
  try {
    // console.log(req.body)
    let lat = req.body[0];
    let long = req.body[1];
    rp(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=0b0d0e3907c63bed7455a34088b44fae`, { json: true })
    .then(function (res) {
      req.weather = res;
      next()
    })
    .catch(function (err) {
      next(err)
    })
  }
  catch (err) {
    next(err)
  }
}
var scheduler = async function (req, res, next) {
  try {
    let coords = req.body;
    var j = schedule.scheduleJob('*/5 * * * * *', function(y){
      rp(`https://api.openweathermap.org/data/2.5/weather?lat=${y[1]}&lon=${y[0]}&appid=0b0d0e3907c63bed7455a34088b44fae`, { json: true })
      .then(function (res) {
        console.log(res.clouds.all)
        next()
      })
      .catch(function (err) {
        next(err)
      })
    }.bind(null,coords));
    next()
  }
  catch (err) {
    next(err)
  }
}
//API route 
app.post('/api/cats',sentinel.sentinelHandler,  function (req, res) {
  try {
    // var request = req.body[0];
    // res.send(req.weather)
    res.send(req.overpass)
  }
  catch { res.send(err) }

})

//run server on port:3000
app.listen(3000, () => {
  console.log("Listening on port 3000");
})


//0b0d0e3907c63bed7455a34088b44fae
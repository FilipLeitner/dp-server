const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const request = require('request');
const rp = require("request-promise");

const app = express();
app.use(bodyParser.json());

var weatherCall = async function  (req, res,next){
  console.log(req.body)
  let lat = req.body.coordinates[0].epsg4326Coordinate[1];
  let long = req.body.coordinates[0].epsg4326Coordinate[0];
  rp(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=0b0d0e3907c63bed7455a34088b44fae`, { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
  }).then(function(res){
    req.weather = res;
    next()
  })
}


app.post('/api/cats', weatherCall, function(req, res){
  let data = JSON.stringify(req.body)
  res.send(req.weather)

})


app.listen(3000, () => {
  console.log("Listening on port 3000");
})

//0b0d0e3907c63bed7455a34088b44fae
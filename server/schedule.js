const rp = require("request-promise");
var schedule = require("node-schedule");

var scheduler = async function (req) {
  console.log(req.body);
  try {
    let coords = [
      (req.body.area[1] + req.body.area[3]) / 2,
      (req.body.area[0] + req.body.area[2]) / 2
    ];

    var rule = new schedule.RecurrenceRule();
    rule.year = parseInt(req.body.overpass.date.substring(0, 4));
    rule.month = parseInt(req.body.overpass.date.substring(5, 7));
    rule.date = parseInt(req.body.overpass.date.substring(8, 10)) - req.body.notificationDate;

    var j = schedule.scheduleJob(
      "*/5 * * * * *",
      function (y) {
        rp(
          `https://api.openweathermap.org/data/2.5/weather?lat=${y[1]}&lon=${y[0]}&appid=0b0d0e3907c63bed7455a34088b44fae`,
          { json: true }
        )
          .then(function (res) {
            console.log('clouds', res.clouds.all);
          })
          .catch(function (err) { });
      }.bind(null, coords)
    );
  } catch (err) {
    console.log(err);
  }
};

exports.scheduler = scheduler;

const rp = require("request-promise");
var schedule = require("node-schedule");
const db = require("../database/index");

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
            //set pending in database to false 
          })
          .catch(function (err) {
            console.log(err)
          });
      }.bind(null, coords)
    );
    // STORE SCHEDULE JOB INTO DATABASE
    //INSERT INTO scheduled_notifications(user,created_at,pending,RecurrenceRule,coords
    console.log(req.body.user)
    db.one(
      "INSERT INTO schedules(email, created_at, pending,recurence,coords) VALUES($/email/,$/created_at/,$/pending/,$/recurence/,$/coords/) RETURNING email",
      {
        email: req.body.user,
        pending: true,
        recurence: rule,
        coords: coords,
        created_at: new Date()
      }
    )
      .then(() => {
      })
      .catch(error => {
        //Error while adding to DB
        console.log(error)
      });

  }
  catch (err) {
    console.log(err);
  }
};

exports.scheduler = scheduler;

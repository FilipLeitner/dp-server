const rp = require("request-promise");
var schedule = require("node-schedule");
const db = require("../database/index");

async function jobExists(date, email) {
  return db.oneOrNone('SELECT * FROM schedules WHERE date = $1 AND email = $2 LIMIT 1', [date, email], a => !!a) // date when to notify
};

function validateDate(date) {
  console.log(new Date(date[0], date[1] - 1, date[2]))
  console.log(new Date())
  return new Date(date[0], date[1] - 1, date[2]) > new Date()
};

var scheduler = async function (req) {
  // console.log(req.body);
  try {
    let coords = [
      (req.body.area[1] + req.body.area[3]) / 2,
      (req.body.area[0] + req.body.area[2]) / 2
    ];

    var rule = new schedule.RecurrenceRule();
    rule.year = parseInt(req.body.overpass.date.substring(0, 4));
    rule.month = parseInt(req.body.overpass.date.substring(5, 7));
    rule.date = parseInt(req.body.overpass.date.substring(8, 10)) - req.body.notificationDate;
    const date = [rule.year, rule.month, rule.date]

    if (!validateDate(date)) {
      throw {
        message: 'Not possible to notificate beforehand with set parameters',
        error: new Error
      }
    }

    //CHECKS WHETHER REQUESTED JOB TO SCHEDULE EXISTS OR NOT
    let job = await jobExists(date, req.body.user)
      .then((response) => {
        console.log('job', response)
        if (response == false) {
          //CREATES SCHEDULE JOB
          var j = schedule.scheduleJob(
            "*/5 * * * * *",
            function (y) {
              rp(
                `https://api.openweathermap.org/data/2.5/weather?lat=${y[1]}&lon=${y[0]}&appid=0b0d0e3907c63bed7455a34088b44fae`,
                { json: true }
              )
                .then(function (res) {
                  console.log('clouds', res.clouds.all, new Date());

                  // only once
                  j.cancel();
                  //set pending in database to false 

                })
                .catch(function (err) {
                  //send notification about error
                  console.log(err)
                });
            }.bind(null, coords)
          );
          // STORE SCHEDULE JOB INFORMATION INTO DATABASE
          // USED FOR CHECKING OF EXISTANCE OR RESCHDULING IN CASE OF SERVER shut down
          db.one(
            "INSERT INTO schedules(email, created_at, pending,recurence,coords,date) VALUES($/email/,$/created_at/,$/pending/,$/recurence/,$/coords/,$/date/) RETURNING email",
            {
              email: req.body.user,
              pending: true,
              recurence: rule,
              coords: coords,
              created_at: new Date(),
              date: [rule.year, rule.month, rule.date]
            }
          )
            .then((response) => {
              console.log('ADDED')
              req.insertMsg = "Job scheduled and saved into database for useer " + req.body.user;
              return 'succes'
            })
            .catch(error => {
              //Error while adding to DB
              console.log(error)
              return error
            });
          return { message: 'Job scheduled and will be saved to database' }
        }
        else {
          console.log('Job already exits, not necessary to cerate anotherone')
          return { message: 'Job already exits, not necessary to cerate anotherone' }
        }

      })
      .catch((error) => {
        console.log(error)
      });
    return job
  }
  catch (err) {
    console.log(err.message);
    return err.message
  }
};

exports.scheduler = scheduler;

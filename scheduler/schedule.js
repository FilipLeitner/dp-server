const rp = require("request-promise");
const schedule = require("node-schedule");
const db = require("../database/index");
const nodemailer = require('nodemailer');
const moment = require('moment')

const fromMail = 'sentinelpredictor@gmail.com'

async function jobExists(identificator, user) {
  console.log(identificator)
  return db.oneOrNone('SELECT * FROM schedules WHERE identificator = $1 AND email = $2 LIMIT 1', [identificator, user], a => !!a) // date when to notify
};

function validateDate(date) {
  console.log(new Date(date[0], date[1] - 1, date[2]))
  console.log(new Date())
  return new Date(date[0], date[1] - 1, date[2]) > new Date()
};
function findForecast(list, date) {
  for (let entry of list) {
    console.log(entry.dt_txt)
    console.log('day', date.day)
    if (entry.dt_txt.includes(date.day) &&
      Math.abs(parseInt(entry.dt_txt.substring(11, 13)) - parseInt(date.time.substring(1, 3))) < 2) {
      console.log('entry', entry)
      return entry
    }
  }
};

const scheduler = async function (req) {
  console.log(moment().format());
  try {
    if (!req.body.overpass.date) {
      throw {
        message: 'You need to select an overpass first',
        error: new Error
      }
    }
    req.identificator = (parseInt(req.body.overpass.date.substring(5, 7)) * parseInt(req.body.overpass.date.substring(8, 10)) * req.body.notificationDate * ((req.body.area[1] + req.body.area[3]) / 2)) * 1000000000000000;
    let coords = [
      (req.body.area[1] + req.body.area[3]) / 2,
      (req.body.area[0] + req.body.area[2]) / 2
    ];
    var rule = new schedule.RecurrenceRule();
    rule.year = parseInt(req.body.overpass.date.substring(0, 4));
    rule.month = parseInt(req.body.overpass.date.substring(5, 7));
    rule.date = parseInt(req.body.overpass.date.substring(8, 10)) - req.body.notificationDate;
    const date = [rule.year, rule.month, rule.date]
    const scheduleDate = new Date(rule.year, rule.month - 1, rule.date, 10, 0, 0)
    const dbDate = [rule.year, rule.month - 1, rule.date, 10, 0, 0]

    if (!validateDate(date)) {
      throw {
        message: 'Not possible to notificate beforehand with set parameters',
        error: new Error
      }
    }

    //CHECKS WHETHER REQUESTED JOB TO SCHEDULE EXISTS OR NOT
    let job = await jobExists(req.identificator, req.body.user)
      .then((response) => {
        console.log('job', req.body)
        if (response == false) {
          //CREATES SCHEDULE JOB
          var j = schedule.scheduleJob(
            scheduleDate,
            function (y) {
              rp(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${y[1]}&lon=${y[0]}&appid=0b0d0e3907c63bed7455a34088b44fae`,
                { json: true }
              )
                .then(function (res) {
                  let forecastNeeded = findForecast(res.list, req.body.overpass);
                  //Define a transporter object
                  const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: fromMail,
                      pass: 'uhorki121'
                    }
                  });
                  let text = forecastNeeded.clouds.all >= 75 ? 'Expected cloud cover over your AOI is ' + forecastNeeded.clouds.all + ' data will most likely be unavaliable' : 'Expected cloud cover over your AOI is ' + forecastNeeded.clouds.all + ' image should be usable'
                  // Email options
                  let mailOptions = {
                    from: fromMail,
                    to: 'leitnerfilip@gmail.com', //req.body.user
                    subject: 'Sentinel predictore notification',
                    text: text,

                  };
                  //Send notification
                  transporter.sendMail(mailOptions, (error, response) => {
                    if (error) {
                      console.log(error);
                    }
                    console.log(response.envelope)
                  });

                  // only once
                  j.cancel();
                  db.none('UPDATE schedules SET pending=$2 WHERE identificator = $1', [req.identificator, false])
                    .then(() => {
                      console.log('Job terminated')
                    })
                    .catch((er) => {
                      console.log(er)
                    });
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
          // ASYNC ADD TO DB ?
          db.one(
            "INSERT INTO schedules(email, created_at, pending,recurence,coords,date,identificator) VALUES($/email/,$/created_at/,$/pending/,$/recurence/,$/coords/,$/date/,$/identificator/) RETURNING email",
            {
              email: req.body.user,
              pending: true,
              recurence: dbDate,
              coords: coords,
              created_at: moment().format(),
              date: [rule.year, rule.month, rule.date],
              identificator: req.identificator
            }
          )
            .then((response) => {
              console.log('ADDED')
              return {
                message: "Job scheduled and saved into database for user " + req.body.user,
                code: 1
              }
            })
            .catch(error => {
              //Error while adding to DB
              console.log(error)
              return error
            });
          return {
            message: "Job scheduled and saved into database for user " + req.body.user,
            code: 1
          }
        }
        else {
          return {
            message: 'Job already exits, not necessary to create anotherone',
            code: 99
          }

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
exports.findForecast = findForecast;

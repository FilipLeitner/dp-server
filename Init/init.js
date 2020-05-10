const rp = require("request-promise");
const schedule = require("node-schedule");
const findForecast = require("../scheduler/schedule");
const db = require("../database/index");
const nodemailer = require('nodemailer');

const fromMail = 'sentinelpredictor@gmail.com'

const restartSchedules = function () {
    db.any('SELECT * FROM schedules WHERE pending = $1', [true])
        .then(function (data) {
            // success;
            console.log(data)

            data.forEach(job => {
                const date = new Date(job.recurence[0], job.recurence[1], job.recurence[2], job.recurence[3], job.recurence[4], job.recurence[5])
                const j = schedule.scheduleJob(date, function (y) {
                    rp(
                        `https://api.openweathermap.org/data/2.5/forecast?lat=${y[1]}&lon=${y[0]}&appid=0b0d0e3907c63bed7455a34088b44fae`,
                        { json: true }
                    )
                        .then((res) => {
                            //Define a transporter object
                            let month = job.date[1] < 10 ? '0' + job.date[1] : job.date[1];
                            let day = job.date[2] < 10 ? '0' + job.date[2] : job.date[2];
                            let forecastNeeded = findForecast.findForecast(res.list, { day: job.date[0] + '-' + month + '-' + day, time: 'T' + job.recurence[3] })
                            console.log(forecastNeeded)
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
                                to: job.email, //req.body.user
                                subject: 'Sentinel predictor notification',
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
                            db.none('UPDATE schedules SET pending=$2 WHERE identificator = $1', [job.identificator, false])
                                .then(() => {
                                    console.log('Job terminated')
                                })
                                .catch((er) => {
                                    console.log(er)
                                });
                            //set pending in database to false 

                        })
                        .catch((err) => {
                            console.log(err)
                        })
                }.bind(null, job.coords)
                )

            });
        })
        .catch(function (error) {
            // error;
            console.log(error)
        });
};

exports.restartSchedules = restartSchedules;

const rp = require("request-promise");
var scheduler = require('./weather');

var sentinelHandler = function (req, res, next) {
    let sentinelAPI = 'f46281e8529cd0720867698265dc425b07ae7a631cec2e3527977c72012afc8c';
    //define BBOX property of https request

    let bbox
    if (req.body.bbox){
        bbox = req.body.bbox;
    }
    else if (req.body.coords) {
        req.body.coords[0] + ',' + req.body.coords[1] + ',' + (req.body.coords[0] + 0.1) + ',' + (req.body.coords[1] + 0.1)
    }

    //define DATE property of https request
    const reqDate = new Date(req.body.date)

    //calculate difference between actual date and requested day of fertilization
    //necessary for {daysAfter} parameter of http request
    let dayDiff = Math.abs((Math.ceil((Math.abs(reqDate - new Date)) / (1000 * 60 * 60 * 24))));
    console.log(reqDate)
    console.log(dayDiff)
    console.log(new Date)
    //http request to Sentinel API 
    rp(`https://api.spectator.earth/overpass/?api_key=${sentinelAPI}&bbox=${bbox}&satellites=Sentinel-2A,Sentinel-2B&days_after=${dayDiff}`, { json: true })
        .then(response => {

            // filter the latest overpass  before the date of fertilaton
            // let sentinelOverpases = response.overpasses[response.overpasses.length-1]
            req.overpasses = response.overpasses
            // scheduler.scheduler(req)
            next()
        })
        .catch(err => {
            console.log(err.statusCode)
            next(err)
        })
}

exports.sentinelHandler = sentinelHandler;

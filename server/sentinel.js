const rp = require("request-promise");

var sentinelHandler = function(req,res,next){
        let sentinelAPI = 'f46281e8529cd0720867698265dc425b07ae7a631cec2e3527977c72012afc8c';
        bbox = req.body.coords[0]+','+req.body.coords[1]+','+(req.body.coords[0]+0.1)+','+(req.body.coords[1]+0.1)
        console.log(bbox)
        rp(`https://api.spectator.earth/overpass/?api_key=${sentinelAPI}&bbox=${bbox}&satellite=Sentinel-2A`, { json: true })
            .then(response => {
                let sentinelOverpases = response.overpasses.filter(overpas => {
                    return overpas.satellite == 'Sentinel-2B' || overpas.satellite == 'Sentinel-2A'
                })
                console.log(sentinelOverpases[0]);
                req.overpass = sentinelOverpases[0];
                next()
            })
        .catch(err =>{
            console.log(err)
        })
    }

exports.sentinelHandler = sentinelHandler;

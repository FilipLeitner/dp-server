
// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PROXY_PORT || 8085;
const fs = require('fs');

const cors_proxy = require('cors-anywhere');
cors_proxy.createServer({
  httpsOptions: {
    key: fs.readFileSync('privkey.pem'),
    cert: fs.readFileSync('fullchain.pem')
  },
  originWhitelist: [], // Allow all origins
  //requireHeader: ['origin', 'x-requested-with'],
  removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});

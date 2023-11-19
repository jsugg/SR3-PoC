const appRoot = require('app-root-path').path;
const https = require('https');
const http = require('https');
const http2 = require('http2'); // used by https library internally
const fs = require('fs');

module.exports.createHttpServer = (app, protocol) => (
  protocol === 'http' ? http.createServer(app) : https.createServer({
    key: fs.readFileSync(`${appRoot}/dev.key`),
    cert: fs.readFileSync(`${appRoot}/dev.cert`)
  }, app)
)

module.exports.createHttpsServer = (app, protocol) => (
  https.createServer(app)
)

module.exports.startServer = (server, port, logger) => (
server.listen(port, () => {
  logger.info(`Server is listening on port ${port}`);
}));

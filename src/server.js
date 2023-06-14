const express = require('express');
const https = require('https');
const http2 = require('http2'); // used by https library
const cors = require('cors');
const bodyParser = require('body-parser');
const appRoot = require('app-root-path').path;
const { logger, httpLogger } = require(`${appRoot}/src/utils/logger`);
const { SETTINGS } = require(`${appRoot}/config/settings`);
const apiRoutes = require('./api');
const { getSpreadsheetData,
        getSpreadsheetWebAssets,
        removeBrokenPhotoLinks } = require(`${appRoot}/src/web/spreadsheetHandler`);
const scraper = require(`${appRoot}/src/utils/scraper/scraper`);
const CronJob = require('cron').CronJob;
const fs = require('fs');

const app = express();
const SERVER = SETTINGS.httpServer;
const PORT = SETTINGS.httpServerPort || 8080;
const PROTOCOL = SETTINGS.serverProtocol;
const corsOptions = {
  origin: `${PROTOCOL}://${SERVER}/`,
  optionsSuccessStatus: 200
}

app.use(httpLogger);
app.use(cors(corsOptions));
app.use(bodyParser.json());


// A few simple routes
app.get('/data', async (req, res) => {
  try {
    const result = await getSpreadsheetData();
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/assets', async (req, res) => {
  try {
    const result = await getSpreadsheetWebAssets();
    res.json(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.use('/api', apiRoutes);

app.use('/', function (req, res, next) {
    next();
}, express.static(`${appRoot}/public`));

const server = https.createServer({
  key: fs.readFileSync(`${appRoot}/dev.key`),
  cert: fs.readFileSync(`${appRoot}/dev.cert`)
}, app);

server.listen(PORT, () => {
  logger.info(`Server is running on ${PROTOCOL}://${SERVER}:${PORT}`);
  logger.info('TLS Enabled');
});


let scraperJob1930 = new CronJob('00 30 19 * * *', function () {
  console.log('Running a task at 19:30 every day in timezone GMT-4');
  scraper({ update: true, sheetName: '[PROD] main' });
}, null, true, 'America/New_York');

let RemoveBrokenPhotoLinksJob1935 = new CronJob('00 35 19 * * *', function () {
  console.log('Running a task at 19:35 every day in timezone GMT-4');
  removeBrokenPhotoLinks("[PROD] main");
}, null, true, 'America/New_York');

let RemoveBrokenPhotoLinksJob730 = new CronJob('00 30 07 * * *', function () {
  console.log('Running a task at 07:30 every day in timezone GMT-4');
  removeBrokenPhotoLinks("[PROD] main");
}, null, true, 'America/New_York');

scraperJob1930.start();
RemoveBrokenPhotoLinksJob1935.start();
RemoveBrokenPhotoLinksJob730.start();

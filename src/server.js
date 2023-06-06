const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const appRoot = require('app-root-path').path;
const { logger, httpLogger } = require(`${appRoot}/src/utils/logger`);
const { SETTINGS } = require(`${appRoot}/config/settings`);
const apiRoutes = require('./api');
const {
  getSpreadsheetData,
  getSpreadsheetWebAssets,
  removeBrokenPhotoLinks
} = require(`${appRoot}/src/web/spreadsheetHandler`);

const scraper = require(`${appRoot}/src/utils/scraper`);
const CronJob = require('cron').CronJob;

const app = express();
const port = process.env.PORT || 3000;
const corsOptions = {
  origin: SETTINGS.httpServerUrl,
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
  let referer = req.headers.referer;
  if (referer && referer.indexOf(SETTINGS.httpServerUrl) !== 0) {
    res.sendStatus(403);
  } else {
    next();
  }
}, express.static(`${appRoot}/public`));

app.listen(port, () => {
  logger.info(`Server is running on ${process.env.httpServerUrl}:${port}`);
});

let scraperJob = new CronJob('00 30 19 * * *', function () {
  console.log('Running a task at 19:30 every day in timezone GMT-4');
  scraper({ update: true, sheetName: '[PROD] main' });
}, null, true, 'America/New_York');

let RemoveBrokenPhotoLinksJob = new CronJob('00 35 19 * * *', function () {
  console.log('Running a task at 19:35 every day in timezone GMT-4');
  removeBrokenPhotoLinks("[PROD] main");
}, null, true, 'America/New_York');

let RemoveBrokenPhotoLinksJob730 = new CronJob('00 30 07 * * *', function () {
  console.log('Running a task at 07:30 every day in timezone GMT-4');
  removeBrokenPhotoLinks("[PROD] main");
}, null, true, 'America/New_York');

scraperJob.start();
RemoveBrokenPhotoLinksJob.start();
RemoveBrokenPhotoLinksJob730.start();

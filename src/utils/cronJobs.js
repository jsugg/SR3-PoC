const CronJob = require('cron').CronJob;
const appRoot = require('app-root-path').path;
const { removeBrokenPhotoLinks } = require(`${appRoot}/src/web/spreadsheetHandler`);
const scraper = require(`${appRoot}/src/utils/scraper/scraper`);

module.exports.startCronJobs = () => {
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
}
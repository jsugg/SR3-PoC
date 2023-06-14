const appRoot = require('app-root-path').path;
require('dotenv').config({ path: `${appRoot}/.env` });

const setup = JSON.parse(process.env.TARGET_SETUP);

exports.TARGET_SETUP = {
    "home": setup.home,
    "selectors": {
        "popOverSelector": setup.selectors.popOverSelector,
        "imgSelector": setup.selectors.imgSelector,
        "jobDescriptionSelector": setup.selectors.jobDescriptionSelector
    },
    "timeImageName": "time.png",
    "servicesImageName": "services.png",
    "feeLineText": setup.feeLineText,
    "wspMessage": setup.wspMessage,
}

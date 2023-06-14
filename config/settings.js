const appRoot = require('app-root-path').path;
require('dotenv').config({ path: `${appRoot}/.env` });

exports.SETTINGS = {
    "httpServer": process.env.HTTP_SERVER,
    "serverProtocol": process.env.HTTP_SERVER_PROTOCOL,
    "httpServerPort": process.env.HTTP_SERVER_PORT,
    "gcpProjectNumber": process.env.GCP_PROJECT_NUMBER,
    "projectScopes": process.env.PROJECT_SCOPES,
    "spreadsheetUrl": process.env.SPREADSHEET_URL,
    "spreadsheetId": process.env.SPREADSHEET_ID,
    "serviceAccountEmail": process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    "keyFilePath": {
        "client_email": process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        "private_key": process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
    }
};

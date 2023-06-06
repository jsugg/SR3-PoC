const appRoot = require('app-root-path').path;
const { SETTINGS } = require(`${appRoot}/config/settings`);
const { google } = require('googleapis');
const { logger } = require(`${appRoot}/src/utils/logger`);

async function authenticate() {
    // Authenticate using service account credentials
    const key = SETTINGS.keyFilePath;
    const auth = new google.auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: [SETTINGS.projectScopes],
    });

    try {
        await auth.authorize();
        google.options({ auth: auth });
    } catch (error) {
        logger.error(`Failed to authenticate due to error: ${error}`);
    }

    return auth;
}

async function getSpreadsheetData(sheetName = "", range = "") {
    let authClient;
    await authenticate().then((auth) => { logger.info('Authenticated successfully'); authClient = auth }).catch(err => logger.error(err));
    google.options({ auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        // Get spreadsheet data
        const tableData = await sheets.spreadsheets.values.get({
            spreadsheetId: SETTINGS.spreadsheetId,
            range: `${sheetName}!${range}`,
        }).catch(error => logger.error(`Error fetching spreadsheet data: ${error}`));
        let values = tableData.data.values;
        let headerRow = values[0];
        let dataRows = values.slice(1);        
        return {
            headerRow: headerRow,
            values: dataRows
        };
    } catch (error) {
        console.error(`Some error getting spreadsheet data: ${error}`);
    }
}

async function setSpreadsheetData(data = [], sheetName = '', range = '') {
    let authClient;
    const spreadsheetId = SETTINGS.spreadsheetId;
    await authenticate().then((auth) => { logger.info('Authenticated successfully'); authClient = auth }).catch(err => logger.error(err));
    google.options({ auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!${range}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: data,
            },
        });
    } catch (error) {
        console.error(`Error updating spreadsheet: ${error}`);
    }
}

module.exports = {
    setSpreadsheetData,
    getSpreadsheetData
}

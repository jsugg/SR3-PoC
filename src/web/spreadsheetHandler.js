const appRoot = require('app-root-path').path;
const { SETTINGS } = require(`${appRoot}/config/settings`);
const { google } = require('googleapis');
const axios = require('axios');
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

// Checked
async function fetchResource(url, options = { responseType: 'arraybuffer' }) {
    const { responseType } = options;
    if (!(responseType === 'arraybuffer' || responseType === 'json')) {
        logger.error(`Invalid response type: ${responseType}`);
        return null;
    }

    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        // Check if the status code was successful
        if ((response.status / 100 | 0) !== 2) {
            //throw Error(`Request returned ${response.statusText}: ${response.data}`);
            logger.error(`Request returned ${response.statusText}: ${response.data}`);
        }
        return response;
    } catch (error) {
        //throw new Error(`Failed to fetch file: ${error.message}`);
        logger.error(`Failed to fetch file: ${error.message}`);
        return null;
    }
}

async function checkImageLink(link) {
    try {
        const response = await fetchResource(link);
        if (response.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log('Error: ', error);
        return false;
    }
}

async function getImages(url) {
    const response = await fetchResource(url, { responseType: 'json' });
    const data = await response.json();
    return data.images;
}

function removeEmptyLinesFromString(inputString) {
    var outputString = inputString.replace(/\n\s*\n/g, "\n");
    outputString = outputString.trim();
    return outputString;
}

function camelCase(string) {
    try {
        var camelCasedString = string.charAt(0).toUpperCase();
        camelCasedString += string.slice(1).toLowerCase();
        return camelCasedString;
    } catch (error) {
        console.log(error);
    }
}

function removeEmptyLines(str) {
    return str.replace(/^\s*[\r\n]/gm, '');
}

function extractURLs(cell) {
    var regex = /^https?:\/\/.*$/;
    var links = [];
    var match;

    while ((match = regex.exec(cell)) !== null) {
        String(match[0]).split(" ").forEach((link) => { if (link && link != "" && link != " ") { console.log(`[Collecting] ${link}`); links.push(link.trim()) } });
        cell = cell.slice(match[0].length);
    }
    return links;
}

async function fetchLink(link) {
    try {
        console.log(`[Fetching] ${link}`);
        const response = await fetchResource(link);
        return response;
    } catch (error) {
        console.log(`Error fetching ${link}: ${error}`);
    }
}

async function getWorkingLinks(links) {
    let workingLinks = [];
    let link, response, responseCode;

    // Testing for link availability
    for (var i = 0; i < links.length; i++) {
        link = links[i];
        try {
            response = await fetchLink(link);
            responseCode = response.status;
            // Resource is not explicitly unavailable, then keep it
            if (responseCode < 400 || responseCode > 404) {
                console.log(`[Keeping] ${link}`);
                workingLinks.push(link);
            } else {
                console.log(`[Discarding] ${link}`);
            }
        } catch (error) {
            console.log(`Error recognizing working links: ${error}`);
        }
    }
    return workingLinks;
}

async function removeBrokenPhotoLinks(sheetName = "main") {
    const PHOTOS_COLUMN = 6;
    await authenticate().then(() => logger.info('Authenticated successfully')).catch(err => logger.error(err));
    try {
        // Get spreadsheet data
        const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId: SETTINGS.Spreadsheet_URL.split('/')[5],
            range: `${sheetName}!F:F`,
        }).catch(error => console.error(`Error fetching spreadsheet data: ${error}`));

        let rows = data.values;
        // Identify working links
        const workingLinks = await getWorkingLinks(getUniqueLinks(sheetName)).catch(error => console.error(`Error fetching working links: ${error}`));;
        // Update spreadsheet cells
        rows.forEach(async (row, index) => {
            let links = [], cell;
            // Cell has contents? Then gather it
            cell = row[0].length ? row[0] : null;
            // Identify available links inside current content
            links = cell ? extractURLs(cell) : [];
            // Were there links? Validate them
            cell = links.length ? links.reduce((link) => {
                return workingLinks.includes(link);
            }) : '';
            // Update the spreadsheet with only valid resources
            await sheets.spreadsheets.values.update({
                spreadsheetId: SETTINGS.spreadsheetId,
                range: `${sheetName}!F${index + 1}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[cell]],
                },
            });
        });
    } catch (error) { console.error(`Error checking/removing unavailable photo links: ${error}`) };
}

async function updateMainSpreadsheet() {
    const spreadsheetId = SETTINGS.spreadsheetId;
    const mainSheetName = "main";
    const etlSheetName = "[ETL] main";
    await authenticate().then(() => logger.info('Authenticated successfully')).catch(err => logger.error(err));

    try {
        // Get spreadsheet data
        const { data: etlData } = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${etlSheetName}!A:G`,
        });
        const etlSpreadsheetData = etlData.values;
        const etlHeader = etlSpreadsheetData[0];

        // Copy from the "[ETL] main" spreadsheet
        const freshData = etlSpreadsheetData.map((etlRow, index) => {
            let newRow = [];
            newRow.push(etlRow[etlHeader.indexOf("Fee")]); // Fee
            newRow.push(etlRow[etlHeader.indexOf("Location")]); // Location
            newRow.push(etlRow[etlHeader.indexOf("Phone")]); // Phone
            newRow.push(etlRow[etlHeader.indexOf("Name")]); // Name
            newRow.push(etlRow[etlHeader.indexOf("Description")]); // Description
            newRow.push(etlRow[etlHeader.indexOf("Photos")]); // Photos
            newRow.push(etlRow[etlHeader.indexOf("Link")]); // Link
            return newRow;
        });

        // Paste into the "main" spreadsheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: `${mainSheetName}!A:G`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: freshData,
            },
        });
    } catch (error) {
        console.error(`Error updating main spreadsheet: ${error}`);
    }
}

async function updateProductionSpreadsheet() {
    const spreadsheetId = SETTINGS.spreadsheetId;
    const productionSheetName = "[PROD] main";
    const etlSheetName = "main";
    await authenticate().then(() => logger.info('Authenticated successfully')).catch(err => logger.error(err));

    try {
        // Get spreadsheet data
        const { data: etlData } = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${etlSheetName}!A:G`,
        });
        const etlSpreadsheetData = etlData.values;
        const etlHeader = etlSpreadsheetData[0];

        // Copy from the "main" spreadsheet
        const freshData = etlSpreadsheetData.map((etlRow, index) => {
            let newRow = [];
            newRow.push(etlRow[etlHeader.indexOf("Fee")]); // Fee
            newRow.push(etlRow[etlHeader.indexOf("Location")]); // Location
            newRow.push(etlRow[etlHeader.indexOf("Phone")]); // Phone
            newRow.push(etlRow[etlHeader.indexOf("Name")]); // Name
            newRow.push(etlRow[etlHeader.indexOf("Description")]); // Description
            newRow.push(etlRow[etlHeader.indexOf("Photos")]); // Photos
            newRow.push(etlRow[etlHeader.indexOf("Link")]); // Link
            return newRow;
        });

        // Paste into the "[PROD] main" spreadsheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: `${productionSheetName}!A:G`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: freshData,
            },
        });
    } catch (error) {
        console.error(`Error updating production spreadsheet: ${error}`);
    }
}

function newLinesToHTMLParagraphs(str) {
    return str.split("\n").map(substring => `<p>${substring}</p>`).join("");
}

async function getImageAsBase64(imageUrl) {
    try {
        const response = await fetchResource(imageUrl);
        if (!response) return null;

        const contentType = response.headers['content-type'];
        if (!/^image\/.*$/.test(contentType)) {
            throw TypeError(`Invalid content type: ${contentType}`);
        }

        const buffer = response.data;
        const base64data = buffer.toString('base64');
        return `data:${contentType};base64,${base64data}`;

    } catch (error) {
        logger.error(`Failed to fetch file: ${error.message}`);
        return null;
    }
}

async function getSpreadsheetData(sheetName = "[prod] main") {
    let authClient;
    await authenticate().then((auth) => { logger.info('Authenticated successfully'); authClient = auth }).catch(err => logger.error(err));
    google.options({ auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        const tableData = await sheets.spreadsheets.values.get({
            spreadsheetId: SETTINGS.spreadsheetId,
            range: `${sheetName}!A:G`,
        }).catch(error => logger.error(`Error fetching spreadsheet data: ${error}`));
        let values = tableData.data.values;
        let headerRow = values[0];
        let dataRows = values.slice(1);
        let data = await Promise.all(dataRows.map(async function (row) {
            let photos = row[headerRow.indexOf("Photos")].split(" ");
            photos = await Promise.all(photos.map(
                async (photo) => {
                    if (photo.length !== 0) {
                        return await getImageAsBase64(photo);
                    }
                    return null;
                })).then((results) => results.filter((photo) => photo !== null))
                .catch(error => logger.error(`Error fetching photo: ${error}`));
            return [
                row[headerRow.indexOf("Fee")],
                row[headerRow.indexOf("Location")],
                row[headerRow.indexOf("Phone")],
                row[headerRow.indexOf("Name")],
                row[headerRow.indexOf("Description")],
                photos,
                row[headerRow.indexOf("Link")]
            ];  
        })).then(logger.info("Done fetching spreadsheet values"))
            .catch(error => logger.error(`Error fetching spreadsheet values: ${error}`));
        return {
            headerRow: headerRow,
            values: data
        }
    } catch (error) {
        console.error(`Some error getting spreadsheet data: ${error}`);
    }
}

async function getSpreadsheetWebAssets(sheetName = "[WEB] Assets") {
    let authClient;
    await authenticate().then((auth) => {
        logger.info('Authenticated successfully'); authClient = auth
    }).catch(err => logger.error(err));
    google.options({ auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        const tableData = await sheets.spreadsheets.values.get({
            spreadsheetId: SETTINGS.spreadsheetId,
            range: `${sheetName}!A:B`,
        }).catch(error => logger.error(`Error fetching spreadsheet data: ${error}`));
        let values = tableData.data.values;
        let headerRow = values[0];
        let dataRows = values.slice(1);
        let data = await Promise.all(dataRows.map(async function (row) {
            let photo = row[headerRow.indexOf("Image")];
            photo = await getImageAsBase64(photo)
            .catch(error => logger.error(`Error fetching image: ${error}`));
            return [
                row[headerRow.indexOf("Id")],
                photo
            ];
        })).then(logger.info("Done fetching spreadsheet assets"))
            .catch(error => logger.error(`Error fetching spreadsheet assets: ${error}`));
        
        return {
            headerRow: headerRow,
            values: data
        };
    } catch (error) {
        console.error(`Some error getting spreadsheet web assets: ${error}`);
    }
}

module.exports = {
    getSpreadsheetData,
    updateProductionSpreadsheet,
    updateMainSpreadsheet,
    removeBrokenPhotoLinks,
    getImages,
    getSpreadsheetWebAssets
};

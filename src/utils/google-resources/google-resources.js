const appRoot = require('app-root-path').path;
const { SETTINGS } = require(`${appRoot}/config/settings`);
const { google } = require('googleapis');
google.options({debug: true});
const { logger } = require(`${appRoot}/src/utils/logger`);
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

let sheets;
let drive;

async function authenticate() {
    // Authenticate using service account credentials
    const key = SETTINGS.keyFilePath;
    _scopes = SETTINGS.projectScopes.split(',');
    const auth = new google.auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: _scopes,
    });

    try {
        await auth.authorize();
        logger.info('Authenticated successfully');
    } catch (error) {
        logger.error(`Failed to authenticate due to error: ${error}`);
    }
    return auth;
}

const auth = new Promise((resolve, reject) => {
    authenticate().then((auth) => {
        resolve(auth);
    }).catch(err => {
        reject(err);
    }).finally(() => { myEmitter.emit('googleAuthReady') });
});

// add event listener for googleAuthReady event
myEmitter.on('googleAuthReady', async () => {
    authClient = await auth;
    try { google.options({ auth: authClient }); }
    catch (err) { logger.error(err); }
    try { sheets = google.sheets({ version: 'v4', auth: authClient }); }
    catch (err) { logger.error(err); }
    try { drive = google.drive({ version: 'v3', auth: authClient }); }
    catch (err) { logger.error(err); }
});

async function getSpreadsheetData(sheetName = "", range = "") {
    try {
        // Get spreadsheet data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SETTINGS.spreadsheetId,
            range: `${sheetName}!${range}`,
        });
        
        let values = response.data.values;
        let headerRow = values[0];
        if (values.length > 1) {
            let dataRows = values.slice(1);
            return {
                headerRow: headerRow,
                values: dataRows
            };
        }
        else {
            return {
                headerRow: headerRow,
                values: []
            };
        }
    } catch (error) {
        logger.error(`Error fetching spreadsheet data: ${error}`);
        logger.error(error.stack); // Log the stack trace
    }
}

async function setSpreadsheetData(data = [], sheetName = null, range = null) {
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
        logger.error(`Error updating spreadsheet: ${error}`);
    }
}

/*
 * Cache management functions
 */

async function getCacheIndexFromGoogleSheets(_sheetName = null, _range = null, _spreadsheetId = null) {
    const __sheetName = _sheetName ? _sheetName : SETTINGS.gsheetsCacheSheetName;
    const __range = _range ? _range : SETTINGS.gsheetsCacheIndexRange;
    const __spreadsheetId = _spreadsheetId ? _spreadsheetId : SETTINGS.spreadsheetId;

    let __sheets;
    authClient = await auth;
    try { __sheets = google.sheets({ version: 'v4', auth: authClient }); }
    catch (err) { logger.error(err); }

    if (!__sheetName || !__range) {
        logger.error('Google Sheets sheet name or range not set');
        return null;
    } 

    try {
        // Get cache index
        logger.info(`_sheets: ${__sheets}, sheetName: ${__sheetName}, range: ${__range}`);
        logger.info(`sheetName: ${__sheetName}`);
        logger.info(`range: ${__range}`);
        __sheets.spreadsheets.values.get({
            spreadsheetId: __spreadsheetId,
            range: `${__sheetName}!${__range}`,
        })
        .then(function (data) {
            logger.info(`Data object: ${data}`);
            let __values = data.data.values;
            let __headerRow = __values[0];
            if (__values.length > 1) {
                let __dataRows = __values.slice(1);
                return {
                    headerRow: __headerRow,
                    values: __dataRows
                };
            }
            else {
                return {
                    headerRow: __headerRow,
                    values: []
                };
            }
        })
        .catch(error => {
            logger.error(`Error fetching cache index from spreadsheet: ${error}`);
            logger.error(error.stack);
            return null;
        });
    } catch (error) {
        logger.error(`Error fetching cache index: ${error}`);
        logger.error(error.stack);
        return null;
    }
}

async function cachedFilesLookup(filename, _spreadsheetId = null, _range = null, _sheetName = null) {
    const sheetName = _sheetName ? _sheetName : SETTINGS.gsheetsCacheSheetName;
    const range = _range ? _range : SETTINGS.gsheetsCacheIndexRange;
    const spreadsheetId = _spreadsheetId ? _spreadsheetId : SETTINGS.spreadsheetId;
    
    if (!sheetName || !range) {
        logger.error('Google Sheets sheet name or range not set');
        return null;
    } 
    
    try {
        const index = await getCacheIndexFromGoogleSheets(sheetName, range, spreadsheetId);
        if (index) {
            let record = index.values.find(record => record[0] === filename);
            if (record) {
                logger.info(`Record for ${filename} found in the cache index. File id: ${record[1]}`);
                return record[1];
            }
            else {
                logger.info(`Record for ${filename} not found in the cache index`);
                return null;
            }
        }
        else {
            logger.info(`Cache index is empty. No records found.`);
            return null;
        }
    } catch(err) {
        logger.error(`Couldn't get the cache index ${err}`);
        throw err;
    }
}

async function deleteFileFromCache(filename, _spreadsheetId = null, _range = null, _sheetName = null, _folderId = null) {
    const sheetName = _sheetName ? _sheetName : SETTINGS.gsheetsCacheSheetName;
    const range = _range ? _range : SETTINGS.gsheetsCacheIndexRange;
    const spreadsheetId = _spreadsheetId ? _spreadsheetId : SETTINGS.spreadsheetId;
    const folderId = _folderId ? _folderId : SETTINGS.gdriveCacheFolderId;

    if (!sheetName || !range) {
        logger.error('Google Sheets sheet name or range not set');
        return null;
    } 

    // Look up in google sheets cache index
    let record = await cachedFilesLookup(filename, spreadsheetId, range, sheetName);

    // If found, delete record from cache index
    if (record) {
        logger.info(`Record for ${filename} found in the cache index. Deleting the record.`);
        try {
            sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!${range}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: cacheIndex.values.filter(record => record[0] !== filename),
                },
            });
            logger.info(`Record for ${filename} deleted from the cache index.`);
            return record;
        } catch (error) {
            logger.error(`Error deleting record from cache index: ${error}`);
            return null;
        }
    }
    
    // And delete the file from google drive
    if (record) {
        logger.info(`Record for ${filename} found in the cache index. Deleting the file.`);
        try {
            drive.files.delete({
                fileId: `${folderId}/${record}`,
                supportsAllDrives: true,
            });
            logger.info(`File ${filename} deleted from Google Drive.`);
        } catch (error) {
            logger.error(`Error deleting file: ${error}`);
        }
    }
    else {
        logger.info(`Record for ${filename} not found in the cache index. Nothing to delete`);
    }
}

async function setCachedFileIndex(filename, fileId, _spreadsheetId, _sheetName, _range) {
    const spreadsheetId = _spreadsheetId ? _spreadsheetId : SETTINGS.gdriveCacheFolderId;
    const sheetName = _sheetName ? _sheetName : SETTINGS.gsheetsCacheSheetName;
    const range = _range ? _range : SETTINGS.gsheetsCacheIndexRange;

    if (!(filename || fileId || spreadsheetId || sheetName || range)) {
        logger.error('Filename, fileId, spreadsheetId, sheetName, or range not set');
        return null;
    }

    // Check if the record exists in the cache index
    let record = await cachedFilesLookup(filename, spreadsheetId, range, sheetName);

    // If found, delete the record
    if (record) {
        record = deleteFileFromCache(filename, spreadsheetId, range, sheetName);
        if (!record) {
            logger.error(`Error in setCachedFileIndex while deleting record from cache index: ${error}`);
            return null;
        }
        logger.info(`Record for ${filename} deleted from the cache index.`);
    }

    // Add the record to the cache index
    try {
        sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!${range}`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [filename, fileId]
                ]
            }
        }).then((response) => {
            logger.info(`Record added to the cache index: ${response}`);
        }).catch((error) => {
            logger.error(`Error adding record to cache index: ${error}`);
        });
    } catch (error) {
        logger.error(`Error adding record to cache index: ${error}`);
    }

    // Make sure the index was created in the cache index
    record = cachedFilesLookup(filename, spreadsheetId, range, sheetName);

    // If found, return the file id
    if (record) {
        return record;
    }
    else {
        logger.error(`Unknown error adding record to cache index.`);
        return null;
    }
}

async function cacheFileToGoogleDrive(filename, data, contentType, _folderId = null) {

    const folderId = _folderId ? _folderId : SETTINGS.gdriveCacheFolderId;
    if (!(folderId || filename || data || contentType)) {
        logger.error('Google Drive folder id, filename, data, or contentType not set');
        return null;
    }

    try {
        // Create a new index for the file in the cache index
        let fileId = Date.now();

        fileId = await setCachedFileIndex(filename, fileId)
        if (!fileId) {
            logger.error(`Error setting cached file index: ${error}`);
            return null;
        }

        // Upload the file to google drive
        const fileMetadata = {
            name: fileId,
            parents: [folderId]
        };
        const media = {
            mimeType: contentType,
            body: data
        }
        return drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        }, (err, file) => {
            if (err) {
                logger.error(`Error creating file in Google Drive: ${err}`);
                deleteFileFromCache(filename);
                return null;
            }
            logger.info('File cached to Google Drive with file Id:' + fileId);
            return fileId;
        });
    } catch (error) {
        logger.error(`Error caching file to Google Drive: ${error}`);
    }
}

async function getCachedFileFromGoogleDrive(fileId, _folderId = null) {
    const folderId = _folderId ? _folderId : SETTINGS.gdriveCacheFolderId;
    if (!(folderId || fileId)) {
        logger.error('Google Drive folder id or file id not set');
        return null;
    }

    return new Promise((resolve, reject) => {
        drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, (err, file) => {
            if (err) {
                logger.error(`Failed to get cached file from google drive: ${err.message}`);
                reject(err);
            } else {
                resolve(file);
            }
        });
    });
}

function getCachedFileUrl(fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

module.exports = {
    setSpreadsheetData,
    getSpreadsheetData,
    cachedFilesLookup,
    cacheFileToGoogleDrive,
    getCachedFileFromGoogleDrive,
    getCachedFileUrl,
}

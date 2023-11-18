const appRoot = require('app-root-path').path;
const { TARGET_SETUP } = require(`${appRoot}/config/sources`);
require('dotenv').config();
const { logger } = require(`${appRoot}/src/utils/logger`);
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const randomUseragent = require('random-useragent');
const { setSpreadsheetData, cachedFilesLookup, cacheFileToGoogleDrive } = require(`${appRoot}/src/utils/google-resources`);

let collection = [];
let toBeRemoved = [];

// In case of heavy scraping you may need this
function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

// In case you want to write data to a file
function writeFile() {
    logger.info('Writing data to file');
    fs.writeFile('output.json', JSON.stringify(collection, null, 2), (err) => {
        if (err) throw err;
    });
    logger.info('Data written to file');
}

function correctCase(str) {
    let words = str.toLowerCase().split(' ');

    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }

    let correctedStr = words.join(' ');
    return correctedStr;
}

function findPhoneNumber(input) {
    if (!input) return [];

    var phonePattern = /\+\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{5})/g;
    var matches = input.match(phonePattern);
    try {
        if (!matches) return [];

        matches = matches.reduce((acc, curr) => {
            if (!acc.includes(curr)) {
                acc.push(curr);
            }
            return acc;
        }, []);
    } catch (err) {
        logger.error(err);
    }
    return matches ? matches.join(", ") : [];
}

function convertHtmlToPlainText(htmlContent) {
    if (!htmlContent) return '';
    const $ = cheerio.load(htmlContent, { xmlMode: true });
    return $.text().trim();
}

function extractAge(text) {
    const regex = /Edad\s*:\s*(\d+)/m;
    const match = regex.exec(text);
    if (match && match[1]) {
      return match[1];
    }
    return '';
}

function removeDuplicates(text) {
    let length;
    const pattern = new RegExp('(?:(.+?)\\s+?\\1\\s*?)+', 'gs');
    while (text.length !== length) {
        length = text.length;
        text = text.replace(pattern, '$1');
    }
    return text;
}
  
function harvest(data) {
    let dataObject = {
        'fee': parseInt(data.summary.split(' / ')[0].replace(/[$.\- ]/g, "")) || '',
        'location': correctCase(data.summary.split(' - ')[1]) || '',
        'phone': data.description ? '\'' + findPhoneNumber(convertHtmlToPlainText(data.description)) : '',
        'name': correctCase(data.name) || '',
        'description': convertHtmlToPlainText(data.description) || '',
        'photos': data.photos?.join(' ') || '',
        'link': data.link || ''
    }

    if (dataObject.fee) {
        collection.push(dataObject);
        logger.info(`Harvested ${dataObject.name}`);
    }
}

async function harvestLinks() {
    try {
        const response = await axios.get(TARGET_SETUP.home);
        let html = response.data;
        const $ = cheerio.load(html);
        const popOver = $(TARGET_SETUP.selectors.popOverSelector);

        popOver.each((i, element) => {
            let data = {};

            data.link = $(element).attr('href');
            data.name = String($(element).attr('title')).trim();
            data.summary = String($(element).attr('data-content')).trim();

            logger.info(`Harvesting ${data.name}`);
            harvest(data);
        });
        logger.info(`Harvested ${collection.length} links`);
        return collection.length;
    }
    catch (err) {
        logger.error(`Error ${err} on ${TARGET_SETUP.home}`);``
    }
}

function extractNumbers(text) {
    const regex = /\$\s*([\d.,]+)/g;
    const matches = text.match(regex);
  
    if (!matches || matches.length === 0) {
      return '';
    }
    const uniqueMatches = [...new Set(matches)].slice(0, 3);
    const formattedNumbers = uniqueMatches.map(match => match.replace(/\s/g, ''));
    const joinedNumbers = formattedNumbers.join(' / ');
    return joinedNumbers;
}

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
  
async function getAndCacheImageAsBase64(imageUrl) {
    try {
        const response = await fetchResource(imageUrl);
        if (!response) return null;

        const contentType = response.headers['content-type'];
        if (!/^image\/.*$/.test(contentType)) {
            throw TypeError(`Invalid content type: ${contentType}`);
        }

        const buffer = response.data;
        const base64data = buffer.toString('base64');

        // returns the id of the file in the google drive
        return await cacheFileToGoogleDrive(imageUrl, base64data, contentType);
        //return `data:${contentType};base64,${base64data}`;

    } catch (error) {
        logger.error(`Failed to fetch file: ${error.message}`);
        return null;
    }
}

async function harvestContents() {
    let i = 1;
    for (const [index, element] of collection.entries()) {
        try {
            const response = await axios.get(element.link, headers = { 'User-Agent': randomUseragent.getRandom() });

            html = response.data;
            const $ = cheerio.load(html);
            await delay(2000);
            const img = $(TARGET_SETUP.selectors.imgSelector);
            const description = $(TARGET_SETUP.selectors.jobDescriptionSelector);

            let photos = [];
            img.each((i, element) => {
                photos.push(String($(element).attr('src')));
            });

            photos = [...new Set(photos)];
            for (const photo of photos)
            {
                let record = await cachedFilesLookup(photo);
                if (!record) {
                    await getAndCacheImageAsBase64(photo).then( async (response) => { 
                        //record = await cachedFilesLookup(photo);
                        if (response) {
                            logger.info(`Cached ${photo} as ${response}`);
                        }
                        else {
                            logger.error(`Error caching ${photo}`);
                        }
                    });
                }
                await delay(2000);
            }
            collection[index].photos = photos.join(' ');

            description.each((i, element) => {
                collection[index].description = String($(element).text());
            });
            collection[index].phone = '\'' + String(findPhoneNumber(collection[index].description));

            const age = extractAge(collection[index].description);

            const timeImageName = TARGET_SETUP.timeImageName;
            let targetElement = $('a').filter((_, element) => $(element).find('img').attr('alt') === timeImageName).first();
            let schedule = targetElement.text().trim() ? targetElement.text().trim() : '';
            if (!schedule) schedule = targetElement.parent().first().text().trim();
            if (!schedule) schedule = $('span:contains("hrs."):first').text().trim();
            if (schedule) schedule = removeDuplicates(schedule);

            targetElement = $(`*:contains("(${TARGET_SETUP.feeLineText})")`);
            let feeLine = targetElement.text().trim();
            let fees = extractNumbers(feeLine);
            if (!fees) fees = collection[index].fee;

            const servicesImageName = TARGET_SETUP.servicesImageName;
            targetElement = $('a').filter((_, element) => $(element).find('img').attr('alt') === servicesImageName).first();
            let services = $('span  a').filter((_, element) => $(element).find('img').attr('alt') === 'services.png').first().parent().text().substring(0, 220).trim();
            if (!services) services = targetElement.text().trim() ? targetElement.text().substring(0, 220).trim() : '';
            if (!services) services = $('span > a').filter((_, element) => $(element).find('img').attr('alt') === 'services.png').first().parent().text().substring(0, 220).trim();
            if (!services) services = targetElement.first().parent().text().trim();
            if (!services) services = $('img[alt="services.png"]:first').first().parent().parent().text().trim().substring(0, 220);
            if (services) services = removeDuplicates(services);
            
            const descriptionText = `Edad: ${age}\n\nPrecios: ${fees}\n\nHorarios: ${schedule}\n\nServicios: ${services}`;
            collection[index].description = descriptionText;
            logger.info(`Harvested ${i} link details`);
            i++;
        } catch (err) {
            logger.error(`Error ${err} on ${element.link}`);
            if (err.response && err.response.status === 404) {
                toBeRemoved.push(index);
            }
        }
    }
}

function removeFailedLinks() {
    for (const [index, element] of toBeRemoved.entries()) {
        logger.info(`Removing ${collection[element].name} from collection`);
        collection.splice(element, 1);
    }
}

async function updateContentSheet(sheetName) {
    let data = [];
    const range = 'A:G';

    data[0] = ['Fee', 'Location', 'Phone', 'Name', 'Description', 'Photos', 'Link'];

    logger.info(`Updating content sheet ${sheetName} with ${collection.length} rows`);
    try {
        for (const [index, element] of collection.entries()) {
            data[index + 1] = [element.fee, element.location, element.phone, element.name, element.description, element.photos, element.link];
        }
        await setSpreadsheetData(data, sheetName, range);        
    } catch (err) {
        logger.error(err);
    }
}

async function main({ update = true, sheetName = '[PROD] main' } = {}) {
    const links = await harvestLinks();
    if (!links) {
        logger.error('No links found');
        return;
    }
    await harvestContents();
    removeFailedLinks();
    if (update) {
        logger.info(`Preparing to update content sheet ${sheetName}`);
        await updateContentSheet(sheetName);
    }
    return collection;
}

module.exports = main;

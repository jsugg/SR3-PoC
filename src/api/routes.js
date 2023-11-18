const express = require('express');
const apiRoutes = require('./index');
const { getProdData, getSpreadsheetWebAssets } = require('../web/spreadsheetHandler');

module.exports.createRouter = (logger) => {
    mainRouter = express.Router();

    mainRouter.use((req, res, next) => {
        req.log = logger;
        next();
      });

    mainRouter.get('/data', async (req, res) => {
        try {
        const result = await getProdData();
        res.json(result);
        } catch (error) {
        res.status(500).send(error.message);
        }
    });
    
    mainRouter.get('/assets', async (req, res) => {
        try {
        const result = await getSpreadsheetWebAssets();
        res.json(result);
        } catch (error) {
        res.status(500).send(error.message);
        }
    });
    
    mainRouter.use('/api', apiRoutes);

    return mainRouter;
}
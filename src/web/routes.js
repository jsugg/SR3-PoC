// Website routes here, if needed
const express = require('express');
const appRoot = require('app-root-path').path;

module.exports.createWebRequestsRouter = (logger) => {

  const webRouter = express.Router();

  webRouter.use((req, res, next) => {
    req.log = logger;
    next();
  });

  webRouter.use('/', function (req, res, next) {
    next();
  }, express.static(`${appRoot}/public`));

  webRouter.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../public' });
  });

  return webRouter;
};

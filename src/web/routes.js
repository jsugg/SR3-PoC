// Website routes here, if needed
const express = require('express');

module.exports.createWebRequestsRouter = (logger) => {

const webRouter = express.Router();

mainRouter.use((req, res, next) => {
  req.log = logger;
  next();
});

webRouter.get('/', (req, res) => {
  res.sendFile('index.html', { root: '../public' });
});

return webRouter;
};

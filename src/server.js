const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const appRoot = require('app-root-path').path;
const { logger, httpLogger } = require(`${appRoot}/src/utils/logger`);
const { SETTINGS } = require(`${appRoot}/config/settings`);
const { createRouter } = require(`${appRoot}/src/api/routes`);
const { createHttpServer, startServer } = require(`${appRoot}/src/utils/server/serverFunctions`);
const { startCronJobs } = require(`${appRoot}/src/utils/cronJobs`);
const { createWebRequestsRouter } = require(`${appRoot}/src/web/routes`);
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const corsOptions = {
  origin: [
    `${SETTINGS.httpServerProtocol}://${SETTINGS.httpServer}:${SETTINGS.httpServerPort || 8080}/`, 
    `${SETTINGS.httpsServerProtocol}://${SETTINGS.httpServer}:${SETTINGS.httpsServerPort || 4443}/`],
  optionsSuccessStatus: 200
}

appRouter = createRouter(httpLogger);
webRequestsRouter = createWebRequestsRouter(httpLogger);
app.use(appRouter);
app.use(webRequestsRouter);
app.use(cors(corsOptions));
app.use(bodyParser.json());

const httpServer = createHttpServer(app, 'http');
const httpsServer = createHttpServer(app, 'https');
startServer(httpServer, SETTINGS.httpServerPort || 8080, logger);
startServer(httpsServer, SETTINGS.httpsServerPort || 4443, logger);

startCronJobs();

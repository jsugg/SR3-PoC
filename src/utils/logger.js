const pino = require('pino');
const pinoHttp = require('pino-http');
const { DateTime } = require("luxon");
const appRoot = require('app-root-path').path;

let logger;
if (process.env.NODE_ENV === 'PROD') {
    const now = DateTime.now().setZone("America/New_York").toFormat("yyyy-LL-dd HH:mm:ss");
    const logStream = pino.destination(`${appRoot}/logs/${now}__PID_${process.pid}.log`);
    logger = pino(logStream);
} else {
    logger = pino();
}

const httpLogger = pinoHttp({ logger: logger });

exports.logger = logger;
exports.httpLogger = httpLogger;

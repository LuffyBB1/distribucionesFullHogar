const winston = require("winston");
const expressWinston = require('express-winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { createLogger, format, transports } = require('winston');


const loggerMiddleware = createLogger({
  level: 'http',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: './src/logging/logs/middlewares-error.log', level: 'error' 
    }),
    new DailyRotateFile({
      filename: './src/logging/logs/middlewares-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});


const loggerHttpEvents = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new DailyRotateFile({
      filename: './src/logging/logs/http-requests-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })    
  ],
  meta: true, 
  msg: "HTTP {{req.method}} {{req.url}} ", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
  expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
  colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
});

const loggerHttpErrors = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new transports.File({ 
      filename: './src/logging/logs/http-errors.log', level: 'error' 
    }),   
  ]
});



module.exports = {
  loggerMiddleware,
  loggerHttpEvents,
  loggerHttpErrors,
};
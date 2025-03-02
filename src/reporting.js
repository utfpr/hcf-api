/* eslint-disable import/no-extraneous-dependencies */
const jsreportAssets = require('@jsreport/jsreport-assets');
const jsreportChromePdf = require('@jsreport/jsreport-chrome-pdf');
const jsreportCore = require('@jsreport/jsreport-core');
const jsreportExpress = require('@jsreport/jsreport-express');
const jsreportFs = require('@jsreport/jsreport-fs-store');
const jsreportHandlebars = require('@jsreport/jsreport-handlebars');
const jsreportPdfUtil = require('@jsreport/jsreport-pdf-utils');
const express = require('express');
const path = require('path');

const reportingApp = express();

const jsreport = jsreportCore({
    store: { provider: 'fs' },
    rootDirectory: path.join(__dirname, '../reports'),
    httpPort: 3001,
    logger: {
        silent: false,
    },
    templatingEngines: {
        timeout: 600000,
        numberOfWorkers: 2,
        strategy: 'http-server | dedicated-process | in-process',
        templateCache: {
            max: 100, // LRU cache with max 100 entries, see npm lru-cache for other options
            enabled: true, // disable cache
        },
    },
    express: {
        inputRequestLimit: '900mb',
    },
    chrome: {
        timeout: 600000,
    },
});

jsreport.use(jsreportFs());
jsreport.use(jsreportAssets());
jsreport.use(jsreportHandlebars());
jsreport.use(jsreportChromePdf());
jsreport.use(jsreportPdfUtil());
jsreport.use(jsreportExpress({ app: reportingApp }));
jsreport.use(require('@jsreport/jsreport-studio')());

jsreport.init();

export default reportingApp;

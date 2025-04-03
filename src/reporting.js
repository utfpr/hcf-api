import jsreportAssets from '@jsreport/jsreport-assets';
import jsreportChromePdf from '@jsreport/jsreport-chrome-pdf';
import jsreportCore from '@jsreport/jsreport-core';
import jsreportExpress from '@jsreport/jsreport-express';
import jsreportFs from '@jsreport/jsreport-fs-store';
import jsreportHandlebars from '@jsreport/jsreport-handlebars';
import jsreportPdfUtil from '@jsreport/jsreport-pdf-utils';
import express from 'express';
import path from 'path';

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
        bodyParser: {
            json: {
                limit: '900mb', // Aumente o limite para 50MB, por exemplo
            },
        },
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

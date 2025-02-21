/* eslint-disable no-console, no-inner-declarations */
import './setup';
import cluster from 'cluster';
import http from 'http';
import os from 'os';

import app from './app';
import serverConfig from './config/server';
import { daemonFazRequisicaoReflora } from './herbarium/reflora/main';
import { daemonSpeciesLink } from './herbarium/specieslink/main';

function startServer() {
    return new Promise((resolve, reject) => {
        http.createServer(app)
            .on('listening', () => {
                console.info(`Worker ${process.pid} started on port ${serverConfig.port}`);
                resolve();
            })
            .on('error', error => {
                if (error.syscall !== 'listen') {
                    reject(error);
                    return;
                }

                switch (error.code) {
                    case 'EACCES':
                        console.error(`Port ${serverConfig.port} requires elevated privileges`);
                        break;
                    case 'EADDRINUSE':
                        console.error(`Port ${serverConfig.port} is already in use`);
                        break;
                    default:
                        break;
                }

                reject(error);
            })
            .listen(serverConfig.port);
    });
}

if (cluster.isPrimary) {
    console.info(`Using "${serverConfig.environment}" environment`);
    console.info(`Master ${process.pid} is running`);

    function forkCluster() {
        cluster.on('exit', (worker, code, signal) => {
            console.warn(`Worker ${worker.process.pid} died with ${code} code and ${signal} signal.`);
            process.exit(1);
        });

        for (let i = 0; i < os.cpus().length; i += 1) {
            cluster.fork();
        }
    }

    function startExternalJobs() {
        /**
         * Essas duas daemon são utilizadas, ela são iniciadas juntamente
         * com o back end. Essas daemon de tempos em tempos verificam
         * se é necessário realizar o processo de atualização do serviço.
         */
        daemonFazRequisicaoReflora();
        daemonSpeciesLink();
        console.warn('Started reflora and species link jobs');
    }

    async function initServer() {
        if (serverConfig.environment === 'production') {
            forkCluster();
        } else {
            await startServer();
        }
    }

    Promise.resolve()
        .then(startExternalJobs)
        .then(initServer)
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
} else {
    Promise.resolve()
        .then(startServer)
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

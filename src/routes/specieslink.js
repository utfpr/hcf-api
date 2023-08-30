import multer from 'multer';
import path from 'path';
import moment from 'moment';
import { upload } from '../config/directory';

const controller = require('../controllers/specieslink-controller');
const controllerComum = require('../controllers/herbariovirtual-controller');

/**
 * Essa variável storage, ela salva o arquivo com o nome que
 * foi definido. Nesse caso o arquivo que é recebido pelo upload
 * será salvo com o seguinte nome: ArquivoSpciesLink + as horas e a data +
 * a extensão do arquivo.
 */
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, `ArquivoSpeciesLink${moment().format('HH-mm-ss-DD-MM-YYYY')}${path.extname(file.originalname)}`);
    },
});

/**
 * Essa variável uploadMiddleware, ela pega o arquivo que foi feito
 * o upload, a partir do nome que foi utilizado no front end. Então
 * a partir desses local que foi definido, é slavo o arquivo nesse local.
 */
const uploadMiddleware = multer({
    dest: upload,
    storage,
}).single('arquivoSpeciesLink');

/**
 * Essa variável app, está relacionada as rotas que vem do front end. Então se no front end
 * é feito uma requisição que ao backend que é uma dessas requisições: /specieslink-executa,
 * /specieslink-status-execucao, /specieslink-todoslogs, /specieslink-log, ela irá chamar
 * a sua respectiva função, que no caso da URL /specieslink-executa é preparaAtualizacao, e assim
 * por diante.
 */
export default app => {
    app.route('/specieslink-executa').post([
        uploadMiddleware,
        controller.preparaAtualizacao,
    ]);
    app.route('/specieslink-status-execucao').get([
        controller.statusExecucao,
    ]);
    app.route('/specieslink-todoslogs').get([
        controllerComum.todosLogs,
    ]);
    app.route('/specieslink-log').get([
        controllerComum.getLog,
    ]);
};

/* Evita o warning de excendo o tamanho da linha */
/* eslint-disable max-len */
import Sequelize from 'sequelize';
import Q from 'q';
import throttledQueue from 'throttled-queue';
import {
    database,
    username,
    password,
    options,
} from '../config/database';
import modeloTombosFotos from '../models/TomboFoto';
import modeloTombos from '../models/Tombo';
import modeloFamilias from '../models/Familia';
import modeloGeneros from '../models/Genero';
import modeloEspecies from '../models/Especie';
import modeloSubespecies from '../models/Subespecie';
import modeloVariedades from '../models/Variedade';
import modeloAlteracao from '../models/Alteracao';
import modeloReflora from '../models/Reflora';
import modeloConfiguracao from '../models/Configuracao';
import modeloUsuario from '../models/Usuario';
import { cadastraUsuario } from '../controllers/usuarios-controller';

export const conexao = new Sequelize(database, username, password, options);

/**
 * A função selectCodBarra, realiza um consulta no banco de dados,
 * mas especificamente na tabela de tombos_fotos, na qual é retornado
 * somente a coluna de código de barra com todos os valores presentes.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectCodBarra() {
    const promessa = Q.defer();
    const tabelaTomboFoto = modeloTombosFotos(conexao, Sequelize);
    // conexao.sync().then(() => {
    tabelaTomboFoto.findAll({
        attributes: ['codigo_barra'],
    }).then(listaCodBarra => {
        promessa.resolve(listaCodBarra);
    });
    // });
    return promessa.promise;
}

/**
 * A função criaTabelaReflora, cria uma tabela chamada reflora,
 * com base no modelo que foi chamado e dentro desse modelo,
 * existe nome das colunas que estarão presentes nessa tabela.
 * Nessa tabela é guardado os códigos de barras, e as respostas das requisições.
 * Detalhe force: true é igual ao drop table.
 * @return tabelaReflora, que é a tabela que foi criada.
 */
export function criaTabelaReflora() {
    const tabelaReflora = modeloReflora(conexao, Sequelize);
    tabelaReflora.sync({ force: true });
    // tabelaReflora.removeAttribute('id');
    return tabelaReflora;
}

/**
 * A função selectTemExecucaoServico, realiza um consulta no banco de dados,
 * mas especificamente na tabela de configuracao, na qual é retornado registros
 * que tem o valor do serviço igual ao valor que foi passado por parâmetro,
 * em que um representa o serviço do Reflora e número dois representa
 * o serviço do species Link que deve ser executado.
 * @param {*} idServico, em que o identificador um é o serviço do Reflora e o identificador
 * dois é o serviço do species Link.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectTemExecucaoServico(idServico) {
    const promessa = Q.defer();
    const tabelaConfiguracao = modeloConfiguracao(conexao, Sequelize);
    // conexao.sync().then(() => {
    tabelaConfiguracao.findAll({
        where: { servico: idServico },
    }).then(listaServico => {
        promessa.resolve(listaServico);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectEstaExecutandoServico, realiza um consulta no banco de dados,
 * mas especificamente na tabela de configuracao, na qual é retornado registros
 * que tem o valor da coluna igual ao atributo nulo, e serviço igual a dois. O nulo nessa coluna
 * representa que é um serviço que não foi executado, e dois representa que é o serviço
 * do species Link que deve ser executado.
 * @param {*} idServico, em que o identificador um é o serviço do Reflora e o identificador
 * dois é o serviço do species Link.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectEstaExecutandoServico(idServico) {
    const promessa = Q.defer();
    const tabelaConfiguracao = modeloConfiguracao(conexao, Sequelize);
    // conexao.sync().then(() => {
    tabelaConfiguracao.findAll({
        where: { hora_fim: null, servico: idServico },
    }).then(listaServico => {
        promessa.resolve(listaServico);
    });
    // });
    return promessa.promise;
}

/**
 * A função insereExecucao, insere um registro na tabela de configuração. Os valores
 * que serão inseridos nos registros são baseados nos valores que foram
 * passados por parâmetro.
 * @param {*} horaAtual, hora atual na qual foi solicitado a execução do serviço.
 * @param {*} horaFim, hora final na qual foi finalizado a execução do serviço.
 * @param {*} periodicidadeUsuario, periodicidade definida pelo usuário que é utilizada
 * no serviço somente do Reflora, no speciesLink é usado nulo.
 * @param {*} proximaAtualizacao, é a data da próxima atualização em que será feito
 * a próxima comparação de dados, utilizada somente no Reflora, no speciesLink é nulo.
 * @param {*} servicoUsuario, é o serviço que está relacionado com os demais campos
 * daqueles registro, então se é um está relacionado ao Reflora e dois caso esteja
 * relacionado ao species Link.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a inserção.
 */
export function insereExecucao(horaAtual, horaFim, periodicidadeUsuario, proximaAtualizacao, servicoUsuario) {
    const tabelaConfiguracao = modeloConfiguracao(conexao, Sequelize);
    const promessa = Q.defer();
    tabelaConfiguracao.create({
        hora_inicio: horaAtual,
        hora_fim: horaFim,
        periodicidade: periodicidadeUsuario,
        data_proxima_atualizacao: proximaAtualizacao,
        nome_arquivo: null,
        servico: servicoUsuario,
    }).then(() => {
        promessa.resolve();
    });
    return promessa.promise;
}

/**
 * A função atualizaTabelaConfiguracaoReflora, ele pega o registro na tabela
 * com base no identificador que foi passado como parâmetro e atualiza
 * com a nova hora de início, hora de fim, data de próxima atualização,
 * periodicidade passada por parâmetro.
 * @param {*} idExecucao, é o identificador do serviço da execução na qual terá
 * os novos valores de hora de início, fim, periodicidade e proxima atualização.
 * @param {*} horaInicio, é a hora de início com a nova hora de início da execução do serviço.
 * @param {*} horaFim, é a hora final com a nova hora de finalização da execução do serviço.
 * @param {*} periodicidadeUsuario, é a periodicidade com a nova periodicidade da execução do serviço.
 * @param {*} proximaAtualizacao, é a data da nova da data da próxima atualização
 * em que será feito a próxima comparação de dados.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a atualização.
 */
export function atualizaTabelaConfiguracaoReflora(idExecucao, horaInicio, horaFim, periodicidadeUsuario, proximaAtualizacao) {
    const tabelaConfiguracaoReflora = modeloConfiguracao(conexao, Sequelize);
    const promessa = Q.defer();
    tabelaConfiguracaoReflora.update(
        {
            hora_inicio: horaInicio,
            hora_fim: horaFim,
            periodicidade: periodicidadeUsuario,
            data_proxima_atualizacao: proximaAtualizacao,
        },
        { where: { id: idExecucao } },
    ).then(() => {
        promessa.resolve();
    });
    return promessa.promise;
}

/**
 * A função atualizaFimTabelaConfiguracao, ele pega o registro na tabela
 * com base no identificador que foi passado como parâmetro e atualiza
 * hora de fim que foi passado por parâmetro.
 * @param {*} idExecucao, é o identificador do serviço da execução na qual terá
 * o seu o valor que é a hora que terminou um processo.
 * @param {*} horaTerminou, é a hora que terminou o processo de comparação do serviço.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a atualização.
 */
export function atualizaFimTabelaConfiguracao(idExecucao, horaTerminou) {
    const tabelaConfiguracaoReflora = modeloConfiguracao(conexao, Sequelize);
    const promessa = Q.defer();
    tabelaConfiguracaoReflora.update(
        { hora_fim: horaTerminou },
        { where: { id: idExecucao } },
    ).then(() => {
        promessa.resolve();
    });
    return promessa.promise;
}

/**
 * A função atualizaNomeArquivoSpeciesLink, ele pega o registro na tabela
 * com base no identificador que foi passado como parâmetro e atualiza
 * com a nova hora de início, hora de fim e o nome arquivo.
 * @param {*} idExecucao, é o identificador do serviço da execução na qual terá
 * os novos valores de hora de início, fim e o nome de arquivo.
 * @param {*} horaInicio, é a hora de início com a nova hora de início da execução do serviço.
 * @param {*} nomeArquivo, é a o nome do arquivo com o novo nome de arquivo que será comparado.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a atualização.
 */
export function atualizaNomeArquivoSpeciesLink(idExecucao, horaInicio, nomeArquivo) {
    const tabelaConfiguracao = modeloConfiguracao(conexao, Sequelize);
    const promessa = Q.defer();
    tabelaConfiguracao.update(
        {
            hora_inicio: horaInicio,
            hora_fim: null,
            nome_arquivo: nomeArquivo,
        },
        { where: { id: idExecucao } },
    ).then(() => {
        promessa.resolve();
    });
    return promessa.promise;
}

/**
 * A função atualizaHoraFimSpeciesLink, ele pega o registro na tabela
 * com base no identificador que foi passado como parâmetro e atualiza
 * hora de fim que foi passado por parâmetro.
 * @param {*} idExecucao, é o identificador do serviço da execução na qual terá
 * o seu o valor que é a hora que terminou um processo.
 * @param {*} horaFim, é a hora que terminou o processo de comparação do serviço.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a atualização.
 */
export function atualizaHoraFimSpeciesLink(idExecucao, horaFim) {
    const tabelaConfiguracao = modeloConfiguracao(conexao, Sequelize);
    const promessa = Q.defer();
    tabelaConfiguracao.update(
        {
            hora_fim: horaFim,
        },
        { where: { id: idExecucao } },
    ).then(() => {
        promessa.resolve();
    });
    return promessa.promise;
}

/**
 * A função insereExecucaoSpeciesLink, insere um registro na tabela de configuração, relacionado
 * ao serviço speciesLink e os valores que serão inseridos nos registros são baseados nos
 * valores que foram passados por parâmetro.
 * @param {*} horaAtual, hora atual na qual foi solicitado a execução do serviço.
 * @param {*} horaFim, hora final na qual foi finalizado a execução do serviço.
 * @param {*} nomeArquivo, é a o nome do arquivo que será comparado.
 * @param {*} servicoUsuario, é o serviço que está relacionado com os demais campos
 * daqueles registro, então se é um está relacionado ao Reflora e dois caso esteja
 * relacionado ao species Link.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a inserção.
 */
export function insereExecucaoSpeciesLink(horaAtual, horaFim, nomeArquivo, servicoUsuario) {
    const tabelaConfiguracao = modeloConfiguracao(conexao, Sequelize);
    const promessa = Q.defer();
    tabelaConfiguracao.create({
        hora_inicio: horaAtual,
        hora_fim: horaFim,
        periodicidade: null,
        data_proxima_atualizacao: null,
        nome_arquivo: nomeArquivo,
        servico: servicoUsuario,
    }).then(() => {
        promessa.resolve();
    });
    return promessa.promise;
}

/**
 * A função insereTabelaReflora, percorre a lista que foi passada por parâmetro
 * e a cada item dessa lista é adicionado o código de barra presente nessa
 * lista na tabela do reflora. Um detalhe que vale a pena ressaltar é que
 * Sem o throttle ele faz muitas conexões simultaneamente, acabando gerando
 * erros. O throttle faz um por um, evitando erros. Algumas soluções no StackOverflow
 * falavam para adicionar certas configurações na criação da conexão, porém nada deu certo.
 * @param {*} tabelaReflora, é a tabela do reflora aonde será adicionado os códigos de barra.
 * @param {*} listaCodBarra, é a lista de códigos de barras que serão inseridos no
 * banco de dados.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a inserção.
 */
export function insereTabelaReflora(tabelaReflora, listaCodBarra) {
    const throttle = throttledQueue(1, 200);
    const promessa = Q.defer();
    listaCodBarra.forEach((codBarra, index) => {
        throttle(() => {
            tabelaReflora.create({
                cod_barra: codBarra.dataValues.codigo_barra,
                tombo_json: null,
                ja_requisitou: false,
                nro_requisicoes: 3,
            }).then(() => {
                if (index === listaCodBarra.length - 1) {
                    promessa.resolve();
                }
            });
        });
    });
    return promessa.promise;
}

/**
 * A função selectUmCodBarra, realiza uma consulta no banco de dados onde são
 * retornados apenas um registro da tabela onde o valor da coluna é zero (ou seja,
 * onde não foi feita a requisição dele).
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectUmCodBarra() {
    const tabelaReflora = modeloReflora(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaReflora.findAll({
        attributes: ['cod_barra'],
        where: {
            [Sequelize.Op.and]:
                [{ nro_requisicoes: { [Sequelize.Op.ne]: 0 } }, { ja_requisitou: false }],
        },
        limit: 1,
    }).then(codBarra => {
        promessa.resolve(codBarra);
    });
    // });
    return promessa.promise;
}

/**
 * A função atualizaTabelaReflora, ele pega a resposta da requisição do Reflora e salva
 * esse registro equivalente ao seu código de barra. Além disso, troca o valor
 * da coluna ja_requisitou de false para true na qual representa que já foi conseguido
 * a resposta da requisiçã odo Reflora.
 * @param {*} codBarra, é o código de barra na qual é necessário para colocar
 * a resposta da requisição no registro correto.
 * @param {*} json, é o JSON com a resposta vinda da requisição do Reflora.
 * @param {*} valorJaRequisitou, é o valor utilizado para marcar que já foi feita
 * a requisição, sendo false que não feito e true que foi feito a requisição.
 */
export function atualizaTabelaReflora(codBarra, json, valorJaRequisitou) {
    const tabelaReflora = modeloReflora(conexao, Sequelize);
    tabelaReflora.update(
        { tombo_json: json, ja_requisitou: valorJaRequisitou },
        { where: { cod_barra: codBarra } },
    );
}

/**
 * A função decrementaTabelaReflora, é invocada quando temos erros
 * na requisição dos códigos de barras, assim é decrementado o valor
 * presente na coluna nro_requisicoes.
 * @param {*} codBarra, é o código de barra na qual aconteceu um erro
 * e é decrementado o valor da coluna nro_requisicoes.
 */
export function decrementaTabelaReflora(codBarra) {
    const tabelaReflora = modeloReflora(conexao, Sequelize);
    tabelaReflora.decrement('nro_requisicoes', { where: { cod_barra: codBarra } });
}

/**
 * A função atualizaJaComparouTabelaReflora, é utilizado para marcar
 * os códigos de barras que tiveram as suas respostas de requisições vindas do Reflora
 * comparadas com as que estão no banco de dados.
 * @param {*} codBarra, é o código de barra na qual é necessário para colocar que já foi
 * feito a comparação.
 */
export function atualizaJaComparouTabelaReflora(codBarra) {
    const tabelaReflora = modeloReflora(conexao, Sequelize);
    tabelaReflora.update(
        { ja_comparou: true },
        { where: { cod_barra: codBarra } },
    );
}

/**
 * A função selectUmaInformacaoReflora, realiza uma consulta no banco de dados onde são
 * retornados apenas um registro na tabela do reflora, em que são registros que tem no banco de dados
 * salvo a resposta da requisição reflora e que não foram comparados.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectUmaInformacaoReflora() {
    const tabelaReflora = modeloReflora(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaReflora.findAll({
        attributes: ['cod_barra', 'tombo_json'],
        where: {
            [Sequelize.Op.and]:
                [{ ja_comparou: false }, { ja_requisitou: true }],
        },
        limit: 1,
    }).then(informacaoReflora => {
        promessa.resolve(informacaoReflora);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectNroTomboNumBarra, realiza uma consulta no banco de dados onde
 * é retornado o número de tombo equivalente ao código de barra.
 * @param {*} codBarra, é o código de barra na qual se deseja saber o seu número de tombo.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectNroTomboNumBarra(codBarra) {
    const tabelaTomboFoto = modeloTombosFotos(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaTomboFoto.findAll({
        attributes: ['tombo_hcf'],
        where: { codigo_barra: codBarra },
    }).then(nroTombo => {
        promessa.resolve(nroTombo);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectTombo, realiza uma consulta no banco de dados e retorna informações
 * de família, gênero, espécie, subespécie, variedade de acordo com
 * o número de tombo que foi passado por parâmetro.
 * @param {*} nroTombo, é o número de tombo na qual será resgatado informações desse número
 * de tombo.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectTombo(nroTombo) {
    const tabelaTombo = modeloTombos(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaTombo.findAll({
        attributes: [
            'familia_id',
            'genero_id',
            'especie_id',
            'sub_especie_id',
            'variedade_id'],
        where: { hcf: nroTombo },
    }).then(tombo => {
        promessa.resolve(tombo);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectFamilia, realiza uma consulta no banco de dados e retorna o nome da família
 * baseado no valor de identificador passado por parâmetro.
 * @param {*} idFamilia, é o identificador da família, na qual será resgatado o nome desse identificador.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectFamilia(idFamilia) {
    const tabelaFamilia = modeloFamilias(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaFamilia.findAll({
        attributes: ['nome'],
        where: { id: idFamilia },
    }).then(familia => {
        promessa.resolve(familia);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectGenero, realiza uma consulta no banco de dados e retorna o nome da gênero
 * baseado no valor de identificador passado por parâmetro.
 * @param {*} idGenero, é o identificador da gênero, na qual será resgatado o nome desse identificador.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectGenero(idGenero) {
    const tabelaGenero = modeloGeneros(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaGenero.findAll({
        attributes: ['nome'],
        where: { id: idGenero },
    }).then(genero => {
        promessa.resolve(genero);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectEspecie, realiza uma consulta no banco de dados e retorna o nome da espécie
 * baseado no valor de identificador passado por parâmetro.
 * @param {*} idEspecie, é o identificador da espécie, na qual será resgatado o nome desse identificador.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectEspecie(idEspecie) {
    const tabelaEspecie = modeloEspecies(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaEspecie.findAll({
        attributes: ['nome', 'autor_id'],
        where: { id: idEspecie },
    }).then(especie => {
        promessa.resolve(especie);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectSubespecie, realiza uma consulta no banco de dados e retorna o nome da subespécie
 * baseado no valor de identificador passado por parâmetro.
 * @param {*} idSubespecie, é o identificador da subespécie, na qual será resgatado o nome desse identificador.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectSubespecie(idSubespecie) {
    const tabelaSubespecies = modeloSubespecies(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaSubespecies.findAll({
        attributes: ['nome'],
        where: { id: idSubespecie },
    }).then(subespecie => {
        promessa.resolve(subespecie);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectVariedade, realiza uma consulta no banco de dados e retorna o nome da variedade
 * baseado no valor de identificador passado por parâmetro.
 * @param {*} idVariedade, é o identificador da variedade, na qual será resgatado o nome desse identificador.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectVariedade(idVariedade) {
    const tabelaVariedade = modeloVariedades(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaVariedade.findAll({
        attributes: ['nome'],
        where: { id: idVariedade },
    }).then(variedade => {
        promessa.resolve(variedade);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectInformacaoTomboJson, realiza uma consulta no banco de dados e retorna todas
 * as alterações que existem daquele tombo que foi passado por parâmetro.
 * @param {*} idTombo, é o identificador do tombo, na qual será resgatado alterações feitas desse tombo.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectInformacaoTomboJson(idTombo) {
    const tabelaAlteracao = modeloAlteracao(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaAlteracao.findAll({
        attributes: ['tombo_json'],
        where: { tombo_hcf: idTombo },
    }).then(listaTombo => {
        promessa.resolve(listaTombo);
    });
    // });
    return promessa.promise;
}

/**
 * A função selectInformacaoTomboJsonEsperando, realiza uma consulta no banco de dados e retorna todas
 * as alterações que existem daquele tombo que foi passado por parâmetro que estejam com o status
 * ESPERANDO.
 * @param {*} idTombo, é o identificador do tombo, na qual será resgatado alterações feitas desse tombo.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectInformacaoTomboJsonEsperando(idTombo) {
    const tabelaAlteracao = modeloAlteracao(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaAlteracao.findAll({
        where: {
            [Sequelize.Op.and]:
                [{ tombo_hcf: idTombo }, { status: 'ESPERANDO' }],
        },
    }).then(listaTombo => {
        promessa.resolve(listaTombo);
    });
    // });
    return promessa.promise;
}

/**
 * A função insereAlteracaoSugerida, ela insere um registro na tabela de alteração
 * quando foi encontrada uma alteração, as informações que serão adicionado
 * nesse registro foram passadas por parâmetro.
 * @param {*} idUsuario, é o identificador do usuário que sugeriu essa alteração.
 * @param {*} statusAlteracao, é o status dessa alteração que foi sugerida e inserida no banco de dados.
 * @param {*} idTombo, é o identificador do tombo para identificar que a alteração sugerida,
 * está relacionada a determinado identificador do tombo.
 * @param {*} tomboJson, é a alteração que foi sugerida no formato JSON.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a inserção.
 */
export function insereAlteracaoSugerida(idUsuario, statusAlteracao, idTombo, tomboJson, diaIdentificacao, mesIdentificacao, anoIdentificacao) {
    const tabelaAlteracao = modeloAlteracao(conexao, Sequelize);
    const throttle = throttledQueue(1, 200);
    const promessa = Q.defer();
    throttle(() => {
        tabelaAlteracao.create({
            usuario_id: idUsuario,
            status: statusAlteracao,
            tombo_hcf: idTombo,
            tombo_json: tomboJson,
            identificacao: true,
            data_identificacao_dia: diaIdentificacao,
            data_identificacao_mes: mesIdentificacao,
            data_identificacao_ano: anoIdentificacao,
        }).then(() => {
            promessa.resolve();
        });
    });
    return promessa.promise;
}

/**
 * A função existeTabelaReflora, executa um SHOW TABLES verificando
 * se existe a tabela do reflora ou não. Se existir a tabela do reflora
 * retorna true, e caso não exista false.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta de verificar se existe ou não a tabela.
 */
export function existeTabelaReflora() {
    const promessa = Q.defer();
    conexao.query('SHOW TABLES', { type: Sequelize.QueryTypes.SHOWTABLES }).then(listaTabelas => {
        listaTabelas.forEach(tabelas => {
            if (tabelas === 'reflora') {
                promessa.resolve(true);
            }
        });
        promessa.resolve(false);
    });
    return promessa.promise;
}

/**
 * A função apagaTabelaReflora, executa um DROP TABLE, ou seja,
 * apagar uma tabela que no caso é a tabela do reflora.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de apagar a tabela.
 */
export function apagaTabelaReflora() {
    const promessa = Q.defer();
    const tabelaReflora = modeloReflora(conexao, Sequelize);
    promessa.resolve(tabelaReflora.drop());
    return promessa.promise;
}

/**
 * A função selectExisteServicoUsuario, verifica se existe um usuário
 * que foi passado por parâmetro, que pode ser REFLORA ou SPECIESLINK.
 * @param {*} servico, é o nome do serviço que pode ser 'REFLORA' ou 'SPECIESLINK'.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function selectExisteServicoUsuario(servico) {
    const tabelaUsuario = modeloUsuario(conexao, Sequelize);
    const promessa = Q.defer();
    // conexao.sync().then(() => {
    tabelaUsuario.findAll({
        where: { nome: servico },
    }).then(listaUsuario => {
        promessa.resolve(listaUsuario);
    });
    // });
    return promessa.promise;
}

/**
 * A função insereIdentificadorUsuario, insere o usuário que foi passado por parâmetro
 * na tabela de usuários.
 * @param {*} identificador, é o nome do identificador que fez a alteração.
 * @return promessa.promise, como é assíncrono ele só retorna quando resolver, ou seja,
 * quando terminar de realizar a consulta.
 */
export function insereIdentificadorUsuario(identificador) {
    // const tabelaUsuario = modeloUsuario(conexao, Sequelize);
    const promessa = Q.defer();
    const usuario = {
        ra: null,
        nome: identificador,
        email: '',
        tipo_usuario_id: '3',
        telefone: null,
        senha: '',
        herbario_id: 1,
    };
    cadastraUsuario(usuario).then(listaUsuario => {
        promessa.resolve(listaUsuario.dataValues.id);
    });
    /*
    tabelaUsuario.create(usuario).then(listaUsuario => {
        promessa.resolve(listaUsuario.dataValues.id);
    });
    */
    return promessa.promise;
}

/**
 * Detalhe para o Sequelize funcionar é necessário funcionar o mysql2;
 * Além disso, o Sequelize funciona com modelos, cada tabela é um modelo.
 */

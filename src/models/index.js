import Sequelize from 'sequelize';

import { database, username, password, options } from '../config/database';
import AlteracaoDef from './Alteracao.js';
import AutorDef from './Autor.js';
import CidadeDef from './Cidade.js';
import ColecaoAnexaDef from './ColecaoAnexa.js';
import ColetorDef from './Coletor.js';
import ColetorComplementarDef from './ColetorComplementar.js';
import ConfiguracaoDef from './Configuracao.js';
import EnderecoDef from './Endereco.js';
import EspecieDef from './Especie.js';
import EstadoDef from './Estado.js';
import FamiliaDef from './Familia.js';
import FaseSucessionalDef from './FaseSucessional.js';
import GeneroDef from './Genero.js';
import HerbarioDef from './Herbario.js';
import IdentificadorDef from './Identificador.js';
import LocalColetaDef from './LocalColeta.js';
import PaisDef from './Pais.js';
import RefloraDef from './Reflora.js';
import ReinoDef from './Reino.js';
import RelevolDef from './Relevo.js';
import RemessaDef from './Remessa.js';
import RetiradaExsiccataDef from './RetiradaExsiccata.js';
import SoloDef from './Solo.js';
import SpecieslinkDef from './Specieslink.js';
import SubespecieDef from './Subespecie.js';
import SubfamiliaDef from './Subfamilia.js';
import TipoDef from './Tipo.js';
import TipoUsuarioDef from './TipoUsuario.js';
import TomboDef from './Tombo.js';
import TomboColetorDef from './TomboColetor.js';
import TomboFotoDef from './TomboFoto.js';
import TomboIdentificadorDef from './TomboIdentificador.js';
import UsuarioDef from './Usuario.js';
import VariedadeDef from './Variedade.js';
import VegetacaoDef from './Vegetacao.js';

const sequelize = new Sequelize(database, username, password, options);

const models = {
    Alteracao: AlteracaoDef(sequelize, Sequelize),
    Autor: AutorDef(sequelize, Sequelize),
    Cidade: CidadeDef(sequelize, Sequelize),
    ColecaoAnexa: ColecaoAnexaDef(sequelize, Sequelize),
    Coletor: ColetorDef(sequelize, Sequelize),
    ColetorComplementar: ColetorComplementarDef(sequelize, Sequelize),
    Configuracao: ConfiguracaoDef(sequelize, Sequelize),
    Endereco: EnderecoDef(sequelize, Sequelize),
    Especie: EspecieDef(sequelize, Sequelize),
    Estado: EstadoDef(sequelize, Sequelize),
    Familia: FamiliaDef(sequelize, Sequelize),
    FaseSucessional: FaseSucessionalDef(sequelize, Sequelize),
    Genero: GeneroDef(sequelize, Sequelize),
    Herbario: HerbarioDef(sequelize, Sequelize),
    Identificador: IdentificadorDef(sequelize, Sequelize),
    LocalColeta: LocalColetaDef(sequelize, Sequelize),
    Pais: PaisDef(sequelize, Sequelize),
    Reflora: RefloraDef(sequelize, Sequelize),
    Reino: ReinoDef(sequelize, Sequelize),
    Relevo: RelevolDef(sequelize, Sequelize),
    Remessa: RemessaDef(sequelize, Sequelize),
    RetiradaExsiccata: RetiradaExsiccataDef(sequelize, Sequelize),
    Solo: SoloDef(sequelize, Sequelize),
    Specieslink: SpecieslinkDef(sequelize, Sequelize),
    Subespecie: SubespecieDef(sequelize, Sequelize),
    Subfamilia: SubfamiliaDef(sequelize, Sequelize),
    Tipo: TipoDef(sequelize, Sequelize),
    TipoUsuario: TipoUsuarioDef(sequelize, Sequelize),
    Tombo: TomboDef(sequelize, Sequelize),
    TomboColetor: TomboColetorDef(sequelize, Sequelize),
    TomboFoto: TomboFotoDef(sequelize, Sequelize),
    TomboIdentificador: TomboIdentificadorDef(sequelize, Sequelize),
    Usuario: UsuarioDef(sequelize, Sequelize),
    Variedade: VariedadeDef(sequelize, Sequelize),
    Vegetacao: VegetacaoDef(sequelize, Sequelize),
};

Object.keys(models).forEach(key => {
    const { associate } = models[key];
    if (typeof associate === 'function') {
        associate(models, sequelize);
    }
});

const defaultExport = {
    ...models,
    Sequelize,
    sequelize,
    default: sequelize,
};

export default defaultExport;

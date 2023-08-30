function associate(modelos) {
    const {
        LocalColeta,
        Tombo,
        Variedade,
        Herbario,
        Tipo,
        Especie,
        Genero,
        Coletor,
        Familia,
        Subfamilia,
        Subespecie,
        ColecaoAnexa,
        Usuario,
        Alteracao,
        TomboColetor,
        Remessa,
        RetiradaExsiccata,
        TomboFoto,
    } = modelos;

    Tombo.hasMany(TomboFoto, {
        foreignKey: 'tombo_hcf',
    });

    Tombo.belongsToMany(Usuario, {
        as: 'identificadores',
        through: {
            model: Alteracao,
            scope: {
                ativo: true,
                status: 'APROVADO',
                identificacao: true,
            },
        },
        foreignKey: 'tombo_hcf',
    });

    Tombo.belongsToMany(Usuario, {
        through: Alteracao,
        foreignKey: 'tombo_hcf',
    });

    Tombo.belongsToMany(Remessa, {
        through: RetiradaExsiccata,
        foreignKey: 'tombo_hcf',
    });

    Tombo.belongsToMany(Coletor, {
        through: TomboColetor,
        foreignKey: 'tombo_hcf',
    });

    Tombo.belongsTo(Herbario, {
        foreignKey: 'entidade_id',
    });

    Tombo.belongsTo(LocalColeta, {
        foreignKey: 'local_coleta_id',
    });

    Tombo.belongsTo(LocalColeta, {
        as: 'local_coleta',
        foreignKey: 'local_coleta_id',
    });

    Tombo.belongsTo(Variedade, {
        foreignKey: 'variedade_id',
    });

    Tombo.belongsTo(Tipo, {
        foreignKey: 'tipo_id',
    });

    Tombo.belongsTo(Especie, {
        foreignKey: 'especie_id',
    });

    Tombo.belongsTo(Especie, {
        as: 'especie',
        foreignKey: 'especie_id',
    });

    Tombo.belongsTo(Genero, {
        foreignKey: 'genero_id',
    });

    Tombo.belongsTo(Familia, {
        foreignKey: 'familia_id',
    });

    Tombo.belongsTo(Subfamilia, {
        foreignKey: 'sub_familia_id',
    });

    Tombo.belongsTo(Subespecie, {
        foreignKey: 'sub_especie_id',
    });

    Tombo.belongsTo(ColecaoAnexa, {
        foreignKey: 'colecao_anexa_id',
    });
}

export const defaultScope = {
    attributes: {
        exclude: [
            'updated_at',
            'created_at',
        ],
    },
};

export default (Sequelize, DataTypes) => {

    const attributes = {
        hcf: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        data_tombo: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        data_coleta_dia: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        data_coleta_mes: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        data_coleta_ano: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        observacao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        nomes_populares: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        numero_coleta: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        latitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        longitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        altitude: {
            type: DataTypes.DOUBLE,
            allowNull: true,
        },
        situacao: {
            type: DataTypes.ENUM('REGULAR', 'PERMUTADO', 'EMPRESTADO', 'DOADO'),
            allowNull: true,
        },
        nome_cientifico: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        cor: {
            type: DataTypes.ENUM('VERMELHO', 'VERDE', 'AZUL'),
            allowNull: true,
        },
        rascunho: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        entidade_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        local_coleta_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        variedade_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        tipo_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        especie_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        genero_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        familia_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sub_familia_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sub_especie_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        colecao_anexa_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('tombos', attributes, options);

    Model.associate = associate;

    return Model;
};

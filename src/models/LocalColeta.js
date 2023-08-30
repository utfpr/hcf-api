function associate(modelos) {
    const {
        LocalColeta,
        Solo,
        Relevo,
        Vegetacao,
        Cidade,
        FaseSucessional,
    } = modelos;

    LocalColeta.belongsTo(Solo, {
        foreignKey: 'solo_id',
    });

    LocalColeta.belongsTo(Relevo, {
        foreignKey: 'relevo_id',
    });

    LocalColeta.belongsTo(Vegetacao, {
        foreignKey: 'vegetacao_id',
    });

    LocalColeta.belongsTo(Cidade, {
        foreignKey: 'cidade_id',
    });

    LocalColeta.belongsTo(FaseSucessional, {
        foreignKey: 'fase_sucessional_id',
    });
}

export const defaultScope = {
    attributes: {
        exclude: [
            'created_at',
            'updated_at',
        ],
    },
};

export default (Sequelize, DataTypes) => {

    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        complemento: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('locais_coleta', attributes, options);

    Model.associate = associate;

    return Model;
};

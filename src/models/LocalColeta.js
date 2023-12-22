function associate(modelos) {
    const {
        LocalColeta,
        Cidade,
        FaseSucessional,
    } = modelos;

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
        cidade_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        fase_sucessional_id: {
            type: DataTypes.INTEGER,
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

function associate(modelos) {
    const {
        Endereco,
        Cidade,
    } = modelos;

    Endereco.belongsTo(Cidade, {
        foreignKey: 'cidade_id',
    });
}

const defaultScope = {
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
        numero: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        logradouro: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        complemento: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('enderecos', attributes, options);

    Model.associate = associate;

    return Model;
};

function associate(modelos) {
    const {
        Endereco,
        Herbario,
    } = modelos;

    Herbario.belongsTo(Endereco, {
        foreignKey: 'endereco_id',
    });
}

export const defaultScope = {
    attributes: {
        exclude: [
            'ativo',
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
        nome: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        caminho_logotipo: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sigla: {
            type: DataTypes.STRING(80),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('herbarios', attributes, options);

    Model.associate = associate;

    return Model;
};

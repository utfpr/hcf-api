function associate(modelos) {
    const { Estado, Cidade } = modelos;

    Cidade.belongsTo(Estado, {
        foreignKey: 'estado_id',
    });
}

export const defaultScope = {
    attributes: {
        exclude: ['created_at', 'updated_at'],
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
        estado_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('cidades', attributes, options);

    Model.associate = associate;

    return Model;
};

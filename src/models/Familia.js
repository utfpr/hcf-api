function associate(modelos) {
    const { Familia, Reino } = modelos;

    Familia.belongsTo(Reino, {
        foreignKey: 'reino_id',
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
        reino_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        nome: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('familias', attributes, options);

    Model.associate = associate;

    return Model;
};

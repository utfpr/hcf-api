function associate(modelos) {
    const {
        Estado,
        Pais,
    } = modelos;

    Estado.belongsTo(Pais, {
        foreignKey: 'pais_id',
    });

    Estado.belongsTo(Pais, {
        as: 'pais',
        foreignKey: 'pais_id',
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
        nome: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        codigo_telefone: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        pais_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('estados', attributes, options);

    Model.associate = associate;

    return Model;
};

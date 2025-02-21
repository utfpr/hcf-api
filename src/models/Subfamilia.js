function associate(modelos) {
    const {
        Autor,
        Familia,
        Subfamilia,
        Reino,
    } = modelos;

    Subfamilia.belongsTo(Autor, {
        foreignKey: 'autor_id',
        as: 'autor',
    });

    Subfamilia.belongsTo(Familia, {
        foreignKey: 'familia_id',
    });

    Subfamilia.belongsTo(Reino, {
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
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        familia_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reino_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('sub_familias', attributes, options);

    Model.associate = associate;

    return Model;
};

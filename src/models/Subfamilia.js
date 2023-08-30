function associate(modelos) {
    const {
        Autor,
        Familia,
        Subfamilia,
    } = modelos;

    Subfamilia.belongsTo(Autor, {
        foreignKey: 'autor_id',
    });
    Subfamilia.belongsTo(Familia, {
        foreignKey: 'familia_id',
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
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('sub_familias', attributes, options);

    Model.associate = associate;

    return Model;
};

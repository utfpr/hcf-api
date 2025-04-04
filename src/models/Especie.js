function associate(modelos) {
    const {
        Autor,
        Familia,
        Especie,
        Genero,
        Reino,
    } = modelos;

    Especie.belongsTo(Autor, {
        foreignKey: 'autor_id',
        as: 'autor',
    });

    Especie.belongsTo(Genero, {
        foreignKey: 'genero_id',
    });

    Especie.belongsTo(Familia, {
        foreignKey: 'familia_id',
    });

    Especie.belongsTo(Reino, {
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
        genero_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        autor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reino_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('especies', attributes, options);

    Model.associate = associate;

    return Model;
};

function associate(modelos) {
    const {
        Autor,
        Familia,
        Especie,
        Genero,
        Variedade,
    } = modelos;

    Variedade.belongsTo(Autor, {
        foreignKey: 'autor_id',
    });
    Variedade.belongsTo(Genero, {
        foreignKey: 'genero_id',
    });
    Variedade.belongsTo(Familia, {
        foreignKey: 'familia_id',
    });
    Variedade.belongsTo(Especie, {
        foreignKey: 'especie_id',
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
        especie_id: {
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
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('variedades', attributes, options);

    Model.associate = associate;

    return Model;
};

function associate(modelos) {

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
            type: DataTypes.STRING(300),
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('relevos', attributes, options);

    Model.associate = associate;

    return Model;
};

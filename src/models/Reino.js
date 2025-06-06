function associate(/* modelos */) {

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
            type: DataTypes.STRING(200),
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('reinos', attributes, options);

    Model.associate = associate;

    return Model;
};

function associate() {}

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
        tombo_hcf: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        identificador_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
        freezeTableName: true,
    };

    const Model = Sequelize.define('tombos_identificadores', attributes, options);

    Model.associate = associate;

    return Model;
};

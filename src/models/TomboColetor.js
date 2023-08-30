function associate(modelos) {

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
        tombo_hcf: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        coletor_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        principal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('tombos_coletores', attributes, options);

    Model.associate = associate;

    return Model;
};

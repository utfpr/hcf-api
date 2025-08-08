function associate(modelos) {
    const { TomboIdentificador, Tombo, Identificador } = modelos;

    TomboIdentificador.belongsTo(Tombo, {
        foreignKey: 'tombo_hcf',
        targetKey: 'hcf',
    });

    TomboIdentificador.belongsTo(Identificador, {
        foreignKey: 'identificador_id',
        targetKey: 'id',
    });
}

export const defaultScope = {
    attributes: {
        exclude: ['created_at', 'updated_at'],
    },
};

export default (Sequelize, DataTypes) => {
    const attributes = {

        tombo_hcf: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        identificador_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        ordem: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
        freezeTableName: true,
        timestamps: false,
    };

    const Model = Sequelize.define('tombos_identificadores', attributes, options);

    Model.associate = associate;

    return Model;
};

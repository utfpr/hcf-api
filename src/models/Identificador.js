function associate(modelos) {
    const { Identificador, Tombo } = modelos;
    Identificador.belongsToMany(Tombo, {
        through: 'tombos_identificadores',
        foreignKey: 'identificador_id',
        otherKey: 'tombo_hcf',
    });
}

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
        nome: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
        freezeTableName: true,
    };

    const Model = Sequelize.define('identificadores', attributes, options);

    Model.associate = associate;

    return Model;
};

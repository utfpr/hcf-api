function associate(modelos) {
    const {
        TomboColetor,
        Tombo,
        Coletor,
    } = modelos;
    Coletor.belongsToMany(Tombo, {
        through: TomboColetor,
        foreignKey: 'coletor_id',
    });
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
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        numero: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('coletores', attributes, options);

    Model.associate = associate;

    return Model;
};

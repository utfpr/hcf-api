function associate(modelos) {
    const {
        Remessa,
        Herbario,
        Tombo,
        RetiradaExsiccata,
    } = modelos;

    Remessa.belongsTo(Herbario, {
        foreignKey: 'entidade_destino_id',
    });

    Remessa.belongsTo(Herbario, {
        foreignKey: 'herbario_id',
    });

    Remessa.belongsToMany(Tombo, {
        through: RetiradaExsiccata,
        foreignKey: 'retirada_exsiccata_id',
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
        observacao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        data_envio: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        entidade_destino_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        herbario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
    };

    const Model = Sequelize.define('remessas', attributes, options);

    Model.associate = associate;

    return Model;
};

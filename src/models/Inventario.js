function associate(modelos) {
    const {
        Inventario,
        ListaConferencia,
        Usuario,
    } = modelos;

    Inventario.belongsTo(ListaConferencia, {
        foreignKey: 'lista_conferencia_id',
    });

    Inventario.belongsTo(Usuario, {
        foreignKey: 'usuario_id',
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
        lista_conferencia_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        total_esperado: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_encontrados: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_nao_encontrados: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {},
        },
    };

    const options = {
        defaultScope,
        tableName: 'inventarios',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    };

    const Model = Sequelize.define('Inventario', attributes, options);
    Model.associate = associate;

    return Model;
};

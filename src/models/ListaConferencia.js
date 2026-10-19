function associate(modelos) {
    const {
        Inventario,
        ListaConferencia,
        ListaConferenciaRfid,
        Rfid,
    } = modelos;

    ListaConferencia.hasMany(ListaConferenciaRfid, {
        foreignKey: 'lista_conferencia_id',
    });

    ListaConferencia.belongsToMany(Rfid, {
        through: ListaConferenciaRfid,
        foreignKey: 'lista_conferencia_id',
        otherKey: 'rfid_id',
    });

    ListaConferencia.hasMany(Inventario, {
        foreignKey: 'lista_conferencia_id',
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
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    };

    const options = {
        defaultScope,
        tableName: 'listas_conferencias',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    };

    const Model = Sequelize.define('ListaConferencia', attributes, options);
    Model.associate = associate;

    return Model;
};

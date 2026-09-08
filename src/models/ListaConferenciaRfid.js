function associate(modelos) {
    const {
        ListaConferencia,
        ListaConferenciaRfid,
        Rfid,
    } = modelos;

    ListaConferenciaRfid.belongsTo(ListaConferencia, {
        foreignKey: 'lista_conferencia_id',
    });

    ListaConferenciaRfid.belongsTo(Rfid, {
        foreignKey: 'rfid_id',
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
        rfid_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    };

    const options = {
        defaultScope,
        tableName: 'listas_conferencias_rfids',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    };

    const Model = Sequelize.define('ListaConferenciaRfid', attributes, options);
    Model.associate = associate;

    return Model;
};

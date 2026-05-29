function associate(modelos) {
    const {
        TomboFoto,
        Rfid,
    } = modelos;

    Rfid.belongsTo(TomboFoto, {
        foreignKey: 'tombo_foto_id'
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
        tombo_foto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        epc: {
            type: DataTypes.STRING(96),
            allowNull: false,
        },
        tid: {
            type: DataTypes.STRING(96),
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'PENDENTE', 
        },
    };

    const options = {
        defaultScope,
        tableName: 'rfids',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    };

    const Model = Sequelize.define('Rfid', attributes, options);

    Model.associate = associate;
    return Model;
};

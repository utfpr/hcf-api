function associate(modelos) {
}

export default (Sequelize, DataTypes) => {

    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cod_barra: {
            type: DataTypes.STRING(12),
            allowNull: true,
        },
        tombo_json: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        ja_comparou: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        ja_requisitou: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        nro_requisicoes: {
            type: DataTypes.INTEGER,
            defaultValue: false,
        },
    };

    const options = {
        freezeTableName: false,
        // Disabilita o created_at e updated_at
        timestamps: false,
        tableName: 'reflora',
    };

    const Model = Sequelize.define('reflora', attributes, options);

    Model.associate = associate;

    return Model;
};

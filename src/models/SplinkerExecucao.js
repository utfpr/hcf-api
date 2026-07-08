function associate(/* models */) {
    // não há associações para este model
}

export default (Sequelize, DataTypes) => {

    const attributes = {
        data_hora: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ultimo_tombo_hcf: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sucesso: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        log_saida: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    };

    const options = {
        freezeTableName: false,
        timestamps: false,
        tableName: 'splinker_execucoes',
    };

    const Model = Sequelize.define('splinker_execucoes', attributes, options);

    Model.associate = associate;

    return Model;
};

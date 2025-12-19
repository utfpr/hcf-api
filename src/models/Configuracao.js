function associate(/* models */) {
    // não há associações para este model
}

export default (Sequelize, DataTypes) => {

    const attributes = {
        hora_inicio: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        hora_fim: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        periodicidade: {
            type: DataTypes.ENUM,
            values: ['MANUAL', 'SEMANAL', '1MES', '2MESES'],
            allowNull: true,
        },
        data_proxima_atualizacao: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        nome_arquivo: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        servico: {
            type: DataTypes.ENUM,
            values: ['REFLORA', 'SPECIESLINK'],
        },
    };

    const options = {
        freezeTableName: false,
        timestamps: false,
        tableName: 'configuracao',
    };

    const Model = Sequelize.define('configuracao', attributes, options);

    Model.associate = associate;

    return Model;
};

function associate(modelos) {
}

/**
CREATE TABLE `configuracao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hora_inicio` varchar(19) NOT NULL,
  `hora_fim` varchar(19) DEFAULT NULL,
  `periodicidade` enum('MANUAL','SEMANAL','1MES','2MESES') DEFAULT NULL,
  `data_proxima_atualizacao` varchar(10) DEFAULT NULL,
  `nome_arquivo` varchar(50) DEFAULT NULL,
  `servico` enum('REFLORA','SPECIESLINK') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET='latin1';
 */
export default (Sequelize, DataTypes) => {

    const attributes = {
        hora_inicio: {
            type: DataTypes.STRING(19),
            allowNull: false,
        },
        hora_fim: {
            type: DataTypes.STRING(19),
            allowNull: true,
        },
        periodicidade: {
            type: DataTypes.ENUM,
            values: ['MANUAL', 'SEMANAL', '1MES', '2MESES'],
            allowNull: true,
        },
        data_proxima_atualizacao: {
            type: DataTypes.STRING(10),
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
        // Disabilita o created_at e updated_at
        timestamps: false,
        tableName: 'configuracao',
    };

    const Model = Sequelize.define('configuracao', attributes, options);

    Model.associate = associate;

    return Model;
};

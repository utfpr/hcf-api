function associate(modelos) {

}

export default (Sequelize, DataTypes) => {

    const attributes = {
        numero: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
    };

    const Model = Sequelize.define('fase_sucessional', attributes);

    Model.associate = associate;

    return Model;
};

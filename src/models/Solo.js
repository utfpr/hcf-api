function associate(modelos) {

}

export default (Sequelize, DataTypes) => {

    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING(300),
            allowNull: false,
        },
    };

    const Model = Sequelize.define('solos', attributes);

    Model.associate = associate;

    return Model;
};

import * as controller from '../controllers/dashboard-controller';

export default app => {
    app.route('/analise/tombo').get([controller.tomboInfo])
    app.route('/analise/temporal').get([controller.tomboSerieTemporal])
};

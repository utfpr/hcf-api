import * as controller from '../controllers/dashboard-controller';

export default app => {
    app.route('/dashboard').get([controller.tomboInfo])
};

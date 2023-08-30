import { obterModeloDarwinCore } from '../controllers/darwincore-controller';


export default app => {
    app.route('/darwincore')
        .get([
            obterModeloDarwinCore,
        ]);
};

import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
    port: process.env.ISSUER_PORT || process.env.PORT || 3000,
    infura: {
        projectId: process.env.ISSUER_INFURA_PROJECT_ID || process.env.INFURA_PROJECT_ID
    },
    kms: {
        secretBoxKey: process.env.ISSUER_SECRET_BOX_KEY || process.env.SECRET_BOX_KEY
    },
    db: {
        dbName: path.resolve(__dirname, '../../tmp', 'issuer.sqlite')
    }
};

export default config;

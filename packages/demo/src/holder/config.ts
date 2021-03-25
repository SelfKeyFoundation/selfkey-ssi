import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
    port: process.env.HOLDER_PORT || process.env.PORT || 3000,
    infura: {
        projectId: process.env.HOLDER_INFURA_PROJECT_ID || process.env.INFURA_PROJECT_ID
    },
    kms: {
        secretBoxKey: process.env.HOLDER_SECRET_BOX_KEY || process.env.SECRET_BOX_KEY
    },
    db: {
        dbName: path.resolve(__dirname, '../../tmp', 'holder.sqlite')
    }
};

export default config;

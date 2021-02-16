import config from './config';
// Storage plugin using TypeOrm
import { Entities } from '@veramo/data-store';

// TypeORM is installed with daf-typeorm
import { createConnection } from 'typeorm';

export const createDBConnection = () => {
    return createConnection({
        type: 'sqlite',
        database: config.db.dbName,
        synchronize: true,
        logging: ['error', 'info', 'warn'],
        entities: Entities
    });
};

export const closeDBConnection = async (conn: any) => {
    await (await conn).close();
};

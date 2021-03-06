import path from 'path';
// Core interfaces
import { createAgent, IDIDManager, IResolver, IDataStore, IKeyManager } from '@veramo/core';

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager';

// Ethr did identity provider
import { EthrDIDProvider } from '@veramo/did-provider-ethr';

// Web did identity provider
import { WebDIDProvider } from '@veramo/did-provider-web';

// Core key manager plugin
import { KeyManager } from '@veramo/key-manager';

// Custom key management system for RN
import { KeyManagementSystem } from '@veramo/kms-local';

// Custom resolvers
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { getResolver as webDidResolver } from 'web-did-resolver';

// Storage plugin using TypeOrm
import { Entities, KeyStore, DIDStore, IDataStoreORM } from '@veramo/data-store';

// TypeORM is installed with daf-typeorm
import { createConnection } from 'typeorm';

// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = path.resolve(__dirname, '../../tmp', 'holder.sqlite');

// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = '3425da85e9bd4a87963e28ab64fae770';

const dbConnection = createConnection({
    type: 'sqlite',
    database: DATABASE_FILE,
    synchronize: true,
    logging: ['error', 'info', 'warn'],
    entities: Entities
});

export const agent = createAgent<
    IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver
>({
    plugins: [
        new KeyManager({
            store: new KeyStore(dbConnection),
            kms: {
                local: new KeyManagementSystem()
            }
        }),
        new DIDManager({
            store: new DIDStore(dbConnection),
            defaultProvider: 'did:ethr:ropsten',
            providers: {
                'did:ethr:ropsten': new EthrDIDProvider({
                    defaultKms: 'local',
                    network: 'ropsten',
                    rpcUrl: 'https://rinkeby.infura.io/v3/' + INFURA_PROJECT_ID
                }),
                'did:web': new WebDIDProvider({
                    defaultKms: 'local'
                })
            }
        }),
        new DIDResolverPlugin({
            resolver: new Resolver({
                ethr: ethrDidResolver({
                    networks: [
                        {
                            name: 'ropsten',
                            rpcUrl: 'https://ropsten.infura.io/v3/' + INFURA_PROJECT_ID
                        }
                    ]
                }).ethr,
                web: webDidResolver().web
            })
        })
    ]
});

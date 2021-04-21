import config from './config';
import { Request } from 'express';
// Core interfaces
import {
    createAgent,
    IDIDManager,
    IResolver,
    IKeyManager,
    IDataStore,
    IMessageHandler
} from '@veramo/core';

import { AgentRouter, ApiSchemaRouter, WebDidDocRouter } from '@veramo/remote-server';

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager';

// Web did identity provider
import { WebDIDProvider } from '@veramo/did-provider-web';

// Core key manager plugin
import { KeyManager } from '@veramo/key-manager';

// Custom key management system for RN
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';

// Custom resolvers
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { getResolver as webDidResolver } from 'web-did-resolver';
import { MessageHandler } from '@veramo/message-handler';
import { DIDComm, DIDCommMessageHandler, IDIDComm } from '@veramo/did-comm';
import { CredentialIssuer, W3cMessageHandler, ICredentialIssuer } from '@veramo/credential-w3c';
import {
    SelectiveDisclosure,
    SdrMessageHandler,
    ISelectiveDisclosure
} from '@veramo/selective-disclosure';

// Storage plugin using TypeOrm
import { KeyStore, DIDStore, DataStore, DataStoreORM, IDataStoreORM } from '@veramo/data-store';

// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = config.infura.projectId;

export const getAgentRouters = (dbConnection: any, basePath: string) => {
    let secretBox;

    if (config.kms.secretBoxKey) {
        secretBox = new SecretBox(config.kms.secretBoxKey);
    }
    const agent = createAgent<
        IDIDManager &
            IKeyManager &
            IDataStore &
            IDataStoreORM &
            IResolver &
            IMessageHandler &
            IDIDComm &
            ICredentialIssuer &
            ISelectiveDisclosure
    >({
        plugins: [
            new KeyManager({
                store: new KeyStore(dbConnection, secretBox),
                kms: {
                    local: new KeyManagementSystem()
                }
            }),
            new DIDManager({
                store: new DIDStore(dbConnection),
                defaultProvider: 'did:ethr:ropsten',
                providers: {
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
                                name: 'mainnet',
                                rpcUrl: 'https://mainnet.infura.io/v3/' + INFURA_PROJECT_ID
                            },
                            {
                                name: 'rinkeby',
                                rpcUrl: 'https://rinkeby.infura.io/v3/' + INFURA_PROJECT_ID
                            },
                            {
                                name: 'ropsten',
                                rpcUrl: 'https://ropsten.infura.io/v3/' + INFURA_PROJECT_ID
                            },
                            {
                                name: 'kovan',
                                rpcUrl: 'https://kovan.infura.io/v3/' + INFURA_PROJECT_ID
                            },
                            {
                                name: 'goerli',
                                rpcUrl: 'https://goerli.infura.io/v3/' + INFURA_PROJECT_ID
                            }
                        ]
                    }).ethr,
                    web: webDidResolver().web
                })
            }),
            new DataStore(dbConnection),
            new DataStoreORM(dbConnection),
            new MessageHandler({
                messageHandlers: [
                    new DIDCommMessageHandler(),
                    new W3cMessageHandler(),
                    new SdrMessageHandler()
                ]
            }),
            new DIDComm(),
            new CredentialIssuer(),
            new SelectiveDisclosure()
        ]
    });

    const getAgentForRequest = async (req: Request) => agent;

    const agentRouter = AgentRouter({
        getAgentForRequest,
        exposedMethods: agent.availableMethods()
    });

    const apiSchemaRouter = ApiSchemaRouter({
        basePath,
        getAgentForRequest,
        exposedMethods: agent.availableMethods()
    });

    const didDocRouter = WebDidDocRouter({
        getAgentForRequest
    });

    return { agentRouter, apiSchemaRouter, didDocRouter, getAgentForRequest, agent };
};

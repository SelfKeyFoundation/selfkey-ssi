import { Connection } from 'typeorm';
import { verifyCredential } from 'did-jwt-vc';

// Core interfaces
import {
    createAgent,
    TAgent,
    IDIDManager,
    IResolver,
    IKeyManager,
    IDataStore,
    IMessageHandler
} from '@veramo/core';

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager';

// Web did identity provider
import { WebDIDProvider } from '@veramo/did-provider-web';

import { EthrDIDProvider } from '@veramo/did-provider-ethr';

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
import {
    CredentialIssuer,
    W3cMessageHandler,
    ICredentialIssuer,
    ICreateVerifiableCredentialArgs
} from '@veramo/credential-w3c';

// Storage plugin using TypeOrm
import { KeyStore, DIDStore, DataStore, DataStoreORM, IDataStoreORM } from '@veramo/data-store';

export interface ISelfkeyAgentOptions {
    dbConnection: Promise<Connection>;
    infuraId?: string;
    kmsKey?: string;
    kmsName?: string;
    agentName?: string;
    didProvider: 'did:web' | 'did:ethr' | 'did:ethr:ropsten';
}

export interface IUnsignedCredential {
    '@context'?: string[];
    id?: string;
    type?: string[];
    issuer?: { id: string; [x: string]: any };
    issuanceDate?: string;
    expirationDate?: string;
    credentialSubject: {
        id?: string;
        [x: string]: any;
    };
    credentialStatus?: {
        id: string;
        type: string;
    };
    [x: string]: any;
}

export default class SelfkeyAgent {
    private agent: TAgent<
        IDIDManager &
            IKeyManager &
            IDataStore &
            IDataStoreORM &
            IResolver &
            IMessageHandler &
            IDIDComm &
            ICredentialIssuer
    >;

    private resolver: Resolver;

    private agentName: string;
    private kmsName: string = 'local';
    private providerName: string;

    constructor(private options: ISelfkeyAgentOptions) {
        let secretBox;

        if (options.kmsKey) {
            secretBox = new SecretBox(options.kmsKey);
        }

        if (options.kmsName) {
            this.kmsName = options.kmsName;
        }

        this.agentName = options.agentName || 'selfkey-agent';
        this.providerName = options.didProvider;
        this.resolver = new Resolver({
            ethr: ethrDidResolver({
                networks: [
                    {
                        name: 'mainnet',
                        rpcUrl: 'https://mainnet.infura.io/v3/' + options.infuraId
                    },
                    {
                        name: 'rinkeby',
                        rpcUrl: 'https://rinkeby.infura.io/v3/' + options.infuraId
                    },
                    {
                        name: 'ropsten',
                        rpcUrl: 'https://ropsten.infura.io/v3/' + options.infuraId
                    },
                    {
                        name: 'kovan',
                        rpcUrl: 'https://kovan.infura.io/v3/' + options.infuraId
                    },
                    {
                        name: 'goerli',
                        rpcUrl: 'https://goerli.infura.io/v3/' + options.infuraId
                    }
                ]
            }).ethr,
            web: webDidResolver().web
        });

        this.agent = createAgent<
            IDIDManager &
                IKeyManager &
                IDataStore &
                IDataStoreORM &
                IResolver &
                IMessageHandler &
                IDIDComm &
                ICredentialIssuer
        >({
            plugins: [
                new KeyManager({
                    store: new KeyStore(options.dbConnection, secretBox),
                    kms: {
                        [this.kmsName]: new KeyManagementSystem()
                    }
                }),
                new DIDManager({
                    store: new DIDStore(options.dbConnection),
                    defaultProvider: options.didProvider,
                    providers: {
                        'did:web': new WebDIDProvider({
                            defaultKms: this.kmsName
                        }),
                        'did:ethr': new EthrDIDProvider({
                            defaultKms: this.kmsName,
                            network: 'mainnet',
                            rpcUrl: 'https://mainnet.infura.io/v3/' + options.infuraId,
                            gas: 1000001,
                            ttl: 60 * 60 * 24 * 30 * 12 + 1
                        }),
                        'did:ethr:ropsten': new EthrDIDProvider({
                            defaultKms: this.kmsName,
                            network: 'ropsten',
                            rpcUrl: 'https://ropsten.infura.io/v3/' + options.infuraId,
                            gas: 1000001,
                            ttl: 60 * 60 * 24 * 30 * 12 + 1
                        })
                    }
                }),
                new DIDResolverPlugin({
                    resolver: this.resolver
                }),
                new DataStore(options.dbConnection),
                new DataStoreORM(options.dbConnection),
                new MessageHandler({
                    messageHandlers: [new DIDCommMessageHandler(), new W3cMessageHandler()]
                }),
                new DIDComm(),
                new CredentialIssuer()
            ]
        });
    }

    static async generateKMSKey() {
        const key = await SecretBox.createSecretKey();
        return key;
    }

    async ensureAgentDID(options?: object) {
        const identifier = await this.agent.didManagerGetOrCreate({
            provider: this.providerName,
            alias: this.agentName,
            kms: this.kmsName,
            options
        });

        return identifier.did;
    }

    async issueCredential(
        credential: IUnsignedCredential,
        options: {
            save?: boolean;
            proofFormat?: string;
        } = { save: false, proofFormat: 'JWT' }
    ) {
        const did = await this.ensureAgentDID();

        if (!credential.issuer) {
            credential.issuer = {
                id: did
            };
        }

        const vc = await this.agent.createVerifiableCredential({
            credential,
            ...options
        } as ICreateVerifiableCredentialArgs);

        return vc;
    }

    async verifyCredential(vc: string | IUnsignedCredential, options?: object) {
        if (typeof vc !== 'string') {
            if (!vc.proof || !vc.proof.jwt) {
                throw new Error('Invalid credential');
            }
            vc = vc.proof.jwt as string;
        }
        const veridiedVC = await verifyCredential(vc, this.resolver);
        return veridiedVC;
    }

    async listCredentials(): Promise<
        {
            hash: string;
            verifiableCredential: object;
        }[]
    > {
        return await this.agent.dataStoreORMGetVerifiableCredentials();
    }

    async listCredentialsForSubjectId(id: string) {
        return await this.agent.dataStoreORMGetVerifiableCredentialsByClaims({
            where: [{ column: 'subject', value: [id] }]
        });
    }

    async listCredentialsForIssuerId(id: string | string[]) {
        if (typeof id === 'string') {
            id = [id];
        }
        return await this.agent.dataStoreORMGetVerifiableCredentialsByClaims({
            where: [{ column: 'issuer', value: id }]
        });
    }
}

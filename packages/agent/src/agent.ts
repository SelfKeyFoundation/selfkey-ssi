import { Connection } from 'typeorm';
import { normalizePresentation, verifyCredential, verifyPresentation } from 'did-jwt-vc';

// Core interfaces
import {
    createAgent,
    TAgent,
    IDIDManager,
    IResolver,
    IKeyManager,
    IDataStore,
    IMessageHandler,
    VerifiableCredential,
    VerifiablePresentation
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

    async getAgentDIDDocument(options?: object) {
        const did = await this.ensureAgentDID(options);
        const doc = await this.resolveDIDDoc(did);

        return doc;
    }

    async resolveDIDDoc(didUrl: string) {
        const doc = await this.agent.resolveDid({ didUrl });
        return doc.didDocument;
    }

    async generateDIDDoc(did: string) {
        const identifiers = await this.agent.dataStoreORMGetIdentifiers({
            where: [
                {
                    column: 'did',
                    value: [did]
                }
            ]
        });

        if (!identifiers.length) {
            return null;
        }

        const identifier = identifiers[0];

        const didDoc = {
            '@context': 'https://w3id.org/did/v1',
            id: identifier.did,
            publicKey: identifier.keys?.map(key => ({
                id: identifier.did + '#' + key.kid,
                type:
                    key.type === 'Secp256k1'
                        ? 'Secp256k1VerificationKey2018'
                        : 'Ed25519VerificationKey2018',
                controller: identifier.did,
                publicKeyHex: key.publicKeyHex
            })),
            authentication: identifier.keys?.map(key => ({
                type:
                    key.type === 'Secp256k1'
                        ? 'Secp256k1SignatureAuthentication2018'
                        : 'Ed25519SignatureAuthentication2018',
                publicKey: identifier.did + '#' + key.kid
            })),
            service: identifier.services
        };

        return didDoc;
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

    async issuePresentation(
        credentials: VerifiableCredential[],
        verifierDID: string,
        holderDid?: string,
        options?: { save: boolean }
    ) {
        if (!holderDid) {
            holderDid = await this.ensureAgentDID();
        }

        let holderIdentity;

        try {
            holderIdentity = await this.agent.didManagerGet({ did: holderDid });
        } catch (error) {
            throw new Error('Holder DID is not defined');
        }

        const presentation = await this.agent.createVerifiablePresentation({
            presentation: {
                holder: holderDid,
                verifier: [verifierDID],
                verifiableCredential: credentials
            },
            proofFormat: 'jwt',
            save: options && options.save
        });

        return presentation;
    }

    async verifyCredential(vc: string | VerifiableCredential, options?: object) {
        if (typeof vc !== 'string') {
            if (!vc.proof || !vc.proof.jwt) {
                throw new Error('Invalid credential');
            }
            vc = vc.proof.jwt as string;
        }
        const verifiedVC = await verifyCredential(vc, this.resolver, options);
        return verifiedVC;
    }

    async verifyPresentation(vp: string | VerifiablePresentation, options?: object) {
        if (typeof vp !== 'string') {
            if (!vp.proof || !vp.proof.jwt) {
                throw new Error('Invalid presentation');
            }
            vp = vp.proof.jwt as string;
        }
        const did = await this.ensureAgentDID();
        const verifiedVP = await verifyPresentation(vp, this.resolver, {
            audience: did,
            ...options
        });
        return verifiedVP;
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

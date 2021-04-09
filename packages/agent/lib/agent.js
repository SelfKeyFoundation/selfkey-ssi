'use strict';
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
Object.defineProperty(exports, '__esModule', { value: true });
const did_jwt_vc_1 = require('did-jwt-vc');
// Core interfaces
const core_1 = require('@veramo/core');
// Core identity manager plugin
const did_manager_1 = require('@veramo/did-manager');
// Web did identity provider
const did_provider_web_1 = require('@veramo/did-provider-web');
const did_provider_ethr_1 = require('@veramo/did-provider-ethr');
// Core key manager plugin
const key_manager_1 = require('@veramo/key-manager');
// Custom key management system for RN
const kms_local_1 = require('@veramo/kms-local');
// Custom resolvers
const did_resolver_1 = require('@veramo/did-resolver');
const did_resolver_2 = require('did-resolver');
const ethr_did_resolver_1 = require('ethr-did-resolver');
const web_did_resolver_1 = require('web-did-resolver');
const message_handler_1 = require('@veramo/message-handler');
const did_comm_1 = require('@veramo/did-comm');
const credential_w3c_1 = require('@veramo/credential-w3c');
// Storage plugin using TypeOrm
const data_store_1 = require('@veramo/data-store');
class SelfkeyAgent {
    constructor(options) {
        this.options = options;
        this.kmsName = 'local';
        let secretBox;
        if (options.kmsKey) {
            secretBox = new kms_local_1.SecretBox(options.kmsKey);
        }
        if (options.kmsName) {
            this.kmsName = options.kmsName;
        }
        this.agentName = options.agentName || 'selfkey-agent';
        this.providerName = options.didProvider;
        this.resolver = new did_resolver_2.Resolver({
            ethr: ethr_did_resolver_1.getResolver({
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
            web: web_did_resolver_1.getResolver().web
        });
        this.agent = core_1.createAgent({
            plugins: [
                new key_manager_1.KeyManager({
                    store: new data_store_1.KeyStore(options.dbConnection, secretBox),
                    kms: {
                        [this.kmsName]: new kms_local_1.KeyManagementSystem()
                    }
                }),
                new did_manager_1.DIDManager({
                    store: new data_store_1.DIDStore(options.dbConnection),
                    defaultProvider: options.didProvider,
                    providers: {
                        'did:web': new did_provider_web_1.WebDIDProvider({
                            defaultKms: this.kmsName
                        }),
                        'did:ethr': new did_provider_ethr_1.EthrDIDProvider({
                            defaultKms: this.kmsName,
                            network: 'mainnet',
                            rpcUrl: 'https://mainnet.infura.io/v3/' + options.infuraId,
                            gas: 1000001,
                            ttl: 60 * 60 * 24 * 30 * 12 + 1
                        }),
                        'did:ethr:ropsten': new did_provider_ethr_1.EthrDIDProvider({
                            defaultKms: this.kmsName,
                            network: 'ropsten',
                            rpcUrl: 'https://ropsten.infura.io/v3/' + options.infuraId,
                            gas: 1000001,
                            ttl: 60 * 60 * 24 * 30 * 12 + 1
                        })
                    }
                }),
                new did_resolver_1.DIDResolverPlugin({
                    resolver: this.resolver
                }),
                new data_store_1.DataStore(options.dbConnection),
                new data_store_1.DataStoreORM(options.dbConnection),
                new message_handler_1.MessageHandler({
                    messageHandlers: [
                        new did_comm_1.DIDCommMessageHandler(),
                        new credential_w3c_1.W3cMessageHandler()
                    ]
                }),
                new did_comm_1.DIDComm(),
                new credential_w3c_1.CredentialIssuer()
            ]
        });
    }
    static generateKMSKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const key = yield kms_local_1.SecretBox.createSecretKey();
            return key;
        });
    }
    ensureAgentDID(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const identifier = yield this.agent.didManagerGetOrCreate({
                provider: this.providerName,
                alias: this.agentName,
                kms: this.kmsName,
                options
            });
            return identifier.did;
        });
    }
    issueCredential(credential, options = { save: false, proofFormat: 'JWT' }) {
        return __awaiter(this, void 0, void 0, function* () {
            const did = yield this.ensureAgentDID();
            if (!credential.issuer) {
                credential.issuer = {
                    id: did
                };
            }
            const vc = yield this.agent.createVerifiableCredential(
                Object.assign({ credential }, options)
            );
            return vc;
        });
    }
    verifyCredential(vc, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof vc !== 'string') {
                if (!vc.proof || !vc.proof.jwt) {
                    throw new Error('Invalid credential');
                }
                vc = vc.proof.jwt;
            }
            const veridiedVC = yield did_jwt_vc_1.verifyCredential(vc, this.resolver);
            return veridiedVC;
        });
    }
    listCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.agent.dataStoreORMGetVerifiableCredentials();
        });
    }
    listCredentialsForSubjectId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.agent.dataStoreORMGetVerifiableCredentialsByClaims({
                where: [{ column: 'subject', value: [id] }]
            });
        });
    }
    listCredentialsForIssuerId(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof id === 'string') {
                id = [id];
            }
            return yield this.agent.dataStoreORMGetVerifiableCredentialsByClaims({
                where: [{ column: 'issuer', value: id }]
            });
        });
    }
}
exports.default = SelfkeyAgent;
//# sourceMappingURL=agent.js.map

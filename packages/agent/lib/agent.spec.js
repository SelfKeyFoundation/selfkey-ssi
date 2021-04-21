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
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
const typeorm_1 = require('typeorm');
const agent_1 = __importDefault(require('./agent'));
const entities_1 = __importDefault(require('./entities'));
describe('SelfkeyAgent', () => {
    const kmsKey = '67626d4921b84328c8f4475d63dba8edfa7c7ddaea310e45b4576d72650c5008';
    const initDb = () =>
        typeorm_1.createConnection({
            type: 'sqljs',
            entities: entities_1.default,
            synchronize: true
        });
    it('generateKMSKey', () =>
        __awaiter(void 0, void 0, void 0, function* () {
            const key1 = yield agent_1.default.generateKMSKey();
            const key2 = yield agent_1.default.generateKMSKey();
            expect(key1).not.toEqual(key2);
            expect(key1.length).toEqual(kmsKey.length);
            expect(key2.length).toEqual(kmsKey.length);
        }));
    describe('Agent instance', () => {
        let agent;
        let dbConnection;
        beforeEach(() => {
            dbConnection = initDb();
            agent = new agent_1.default({
                dbConnection,
                kmsKey,
                infuraId: '3425da85e9bd4a87963e28ab64fae770',
                didProvider: 'did:ethr'
            });
        });
        afterEach(() =>
            __awaiter(void 0, void 0, void 0, function* () {
                yield (yield dbConnection).close();
            })
        );
        describe('ensureAgentIdentifier', () => {
            it('did:ethr', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    agent = new agent_1.default({
                        dbConnection,
                        kmsKey,
                        didProvider: 'did:ethr'
                    });
                    const did = yield agent.ensureAgentDID();
                    expect(did.startsWith('did:ethr')).toBe(true);
                    const did2 = yield agent.ensureAgentDID();
                    expect(did).toEqual(did2);
                }));
            it('did:ethr:ropsten', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    agent = new agent_1.default({
                        dbConnection,
                        kmsKey,
                        didProvider: 'did:ethr:ropsten'
                    });
                    const did = yield agent.ensureAgentDID();
                    expect(did.startsWith('did:ethr:ropsten')).toBe(true);
                    const did2 = yield agent.ensureAgentDID();
                    expect(did).toEqual(did2);
                }));
            it('did:web', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    agent = new agent_1.default({
                        dbConnection,
                        kmsKey,
                        didProvider: 'did:web',
                        agentName: 'example.com'
                    });
                    const did = yield agent.ensureAgentDID();
                    expect(did).toEqual('did:web:example.com');
                    const did2 = yield agent.ensureAgentDID();
                    expect(did).toEqual(did2);
                }));
        });
        describe('generateDIDDoc', () => {
            it('did:web', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    agent = new agent_1.default({
                        dbConnection,
                        kmsKey,
                        didProvider: 'did:web',
                        agentName: 'example.com'
                    });
                    const did = yield agent.ensureAgentDID();
                    const doc = yield agent.generateDIDDoc(did);
                    expect(doc).toEqual(
                        expect.objectContaining({
                            '@context': 'https://w3id.org/did/v1',
                            id: 'did:web:example.com'
                        })
                    );
                }));
        });
        // TODO: mock to avoid network requests
        describe('issueCredential', () => {
            it('should issue a credential', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    const vc = yield agent.issueCredential({
                        credentialSubject: {
                            id: 'did:ethr:0x4cc19356f2d37338b9802aa8e8fc58b0373296e7',
                            name: 'test'
                        }
                    });
                    expect(vc.proof.type).toEqual('JwtProof2020');
                }));
        });
        describe('verifiyCredential', () => {
            const vc = {
                credentialSubject: {
                    name: 'test',
                    id: 'did:ethr:0x4cc19356f2d37338b9802aa8e8fc58b0373296e7'
                },
                issuer: {
                    id: 'did:ethr:0xf3068b4338a090c0799d15ad695bb2105868e8cf'
                },
                type: ['VerifiableCredential'],
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                issuanceDate: '2021-04-07T11:36:01.000Z',
                proof: {
                    type: 'JwtProof2020',
                    jwt:
                        'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJuYW1lIjoidGVzdCJ9LCJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl19LCJzdWIiOiJkaWQ6ZXRocjoweDRjYzE5MzU2ZjJkMzczMzhiOTgwMmFhOGU4ZmM1OGIwMzczMjk2ZTciLCJuYmYiOjE2MTc3OTUzNjEsImlzcyI6ImRpZDpldGhyOjB4ZjMwNjhiNDMzOGEwOTBjMDc5OWQxNWFkNjk1YmIyMTA1ODY4ZThjZiJ9.TcysKSRwPsPZDFMU1V2_dM_cvUc-ETXSlh1P9ZSxWQZhzEzj94AbF2oREgUgs7B4i99wuefkeHTJD-NaCZm5kg'
                }
            };
            it('should verifty credentials', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    const verified = yield agent.verifyCredential(vc);
                    expect(verified.signer).toEqual({
                        id: 'did:ethr:0xf3068b4338a090c0799d15ad695bb2105868e8cf#controller',
                        type: 'EcdsaSecp256k1RecoveryMethod2020',
                        controller: 'did:ethr:0xf3068b4338a090c0799d15ad695bb2105868e8cf',
                        blockchainAccountId: '0xF3068B4338A090C0799d15Ad695bB2105868e8cF@eip155:1'
                    });
                }));
        });
        describe('listCredentials', () => {
            let c1;
            let c2;
            beforeEach(() =>
                __awaiter(void 0, void 0, void 0, function* () {
                    c1 = yield agent.issueCredential(
                        {
                            credentialSubject: {
                                id: 'test1',
                                name: 'test1'
                            }
                        },
                        {
                            save: true
                        }
                    );
                    c2 = yield agent.issueCredential(
                        {
                            credentialSubject: {
                                id: 'test2',
                                name: 'test2'
                            }
                        },
                        {
                            save: true
                        }
                    );
                })
            );
            it('should list credentials', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    const list = yield agent.listCredentials();
                    expect(list).toEqual([
                        expect.objectContaining({ verifiableCredential: c1 }),
                        expect.objectContaining({ verifiableCredential: c2 })
                    ]);
                    expect(list[0].hash).not.toEqual(list[1].hash);
                }));
            it('should return credentials for subject', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    expect(yield agent.listCredentialsForSubjectId('test1')).toEqual([
                        expect.objectContaining({ verifiableCredential: c1 })
                    ]);
                }));
            it('should return credentials for issuer', () =>
                __awaiter(void 0, void 0, void 0, function* () {
                    const did = yield agent.ensureAgentDID();
                    expect(yield agent.listCredentialsForIssuerId(did)).toEqual([
                        expect.objectContaining({ verifiableCredential: c1 }),
                        expect.objectContaining({ verifiableCredential: c2 })
                    ]);
                    expect(yield agent.listCredentialsForIssuerId('test')).toEqual([]);
                }));
        });
    });
});
//# sourceMappingURL=agent.spec.js.map

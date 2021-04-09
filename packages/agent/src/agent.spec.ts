import { VerifiableCredential } from '@veramo/core';
import { createConnection, Connection } from 'typeorm';
import SelfkeyAgent from './agent';
import Entities from './entities';

describe('SelfkeyAgent', () => {
    const kmsKey = '67626d4921b84328c8f4475d63dba8edfa7c7ddaea310e45b4576d72650c5008';
    const initDb = () =>
        createConnection({
            type: 'sqljs',
            entities: Entities,
            synchronize: true
        });
    it('generateKMSKey', async () => {
        const key1 = await SelfkeyAgent.generateKMSKey();
        const key2 = await SelfkeyAgent.generateKMSKey();

        expect(key1).not.toEqual(key2);
        expect(key1.length).toEqual(kmsKey.length);
        expect(key2.length).toEqual(kmsKey.length);
    });

    describe('Agent instance', () => {
        let agent: SelfkeyAgent;
        let dbConnection: Promise<Connection>;

        beforeEach(() => {
            dbConnection = initDb();
            agent = new SelfkeyAgent({
                dbConnection,
                kmsKey,
                infuraId: '3425da85e9bd4a87963e28ab64fae770',
                didProvider: 'did:ethr'
            });
        });

        afterEach(async () => {
            await (await dbConnection).close();
        });

        describe('ensureAgentIdentifier', () => {
            it('did:ethr', async () => {
                agent = new SelfkeyAgent({
                    dbConnection,
                    kmsKey,
                    didProvider: 'did:ethr'
                });

                const did = await agent.ensureAgentDID();

                expect(did.startsWith('did:ethr')).toBe(true);

                const did2 = await agent.ensureAgentDID();

                expect(did).toEqual(did2);
            });

            it('did:ethr:ropsten', async () => {
                agent = new SelfkeyAgent({
                    dbConnection,
                    kmsKey,
                    didProvider: 'did:ethr:ropsten'
                });

                const did = await agent.ensureAgentDID();

                expect(did.startsWith('did:ethr:ropsten')).toBe(true);

                const did2 = await agent.ensureAgentDID();

                expect(did).toEqual(did2);
            });

            it('did:web', async () => {
                agent = new SelfkeyAgent({
                    dbConnection,
                    kmsKey,
                    didProvider: 'did:web',
                    agentName: 'example.com'
                });

                const did = await agent.ensureAgentDID();

                expect(did).toEqual('did:web:example.com');

                const did2 = await agent.ensureAgentDID();

                expect(did).toEqual(did2);
            });
        });
        // TODO: mock to avoid network requests
        describe('issueCredential', () => {
            it('should issue a credential', async () => {
                const vc = await agent.issueCredential({
                    credentialSubject: {
                        id: 'did:ethr:0x4cc19356f2d37338b9802aa8e8fc58b0373296e7',
                        name: 'test'
                    }
                });
                expect(vc.proof.type).toEqual('JwtProof2020');
            });
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
            it('should verifty credentials', async () => {
                const verified = await agent.verifyCredential(vc);
                expect(verified.signer).toEqual({
                    id: 'did:ethr:0xf3068b4338a090c0799d15ad695bb2105868e8cf#controller',
                    type: 'EcdsaSecp256k1RecoveryMethod2020',
                    controller: 'did:ethr:0xf3068b4338a090c0799d15ad695bb2105868e8cf',
                    blockchainAccountId: '0xF3068B4338A090C0799d15Ad695bB2105868e8cF@eip155:1'
                });
            });
        });

        describe('listCredentials', () => {
            let c1: VerifiableCredential;
            let c2: VerifiableCredential;

            beforeEach(async () => {
                c1 = await agent.issueCredential(
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

                c2 = await agent.issueCredential(
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
            });
            it('should list credentials', async () => {
                const list = await agent.listCredentials();
                expect(list).toEqual([
                    expect.objectContaining({ verifiableCredential: c1 }),
                    expect.objectContaining({ verifiableCredential: c2 })
                ]);
                expect(list[0].hash).not.toEqual(list[1].hash);
            });

            it('should return credentials for subject', async () => {
                expect(await agent.listCredentialsForSubjectId('test1')).toEqual([
                    expect.objectContaining({ verifiableCredential: c1 })
                ]);
            });

            it('should return credentials for issuer', async () => {
                const did = await agent.ensureAgentDID();
                expect(await agent.listCredentialsForIssuerId(did)).toEqual([
                    expect.objectContaining({ verifiableCredential: c1 }),
                    expect.objectContaining({ verifiableCredential: c2 })
                ]);

                expect(await agent.listCredentialsForIssuerId('test')).toEqual([]);
            });
        });
    });
});

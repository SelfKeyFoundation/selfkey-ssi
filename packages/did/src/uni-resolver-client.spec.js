import sinon from 'sinon';
import { ParameterValidationError } from 'parameter-validator';
import UniResolverClient from './uni-resolver-client';
import ResolutionResult from './resolution-result';

const ENDPOINT = 'http://localhost:8080';
describe('UniResolverClient', () => {
    const opt = { endpoint: ENDPOINT };
    afterEach(() => {
        sinon.restore();
    });
    describe('constructor', () => {
        it('should construct if all parameters are correct', () => {
            const uniResolver = new UniResolverClient(opt);
            expect(uniResolver.endpoint).toEqual(ENDPOINT);
        });

        it('should throw parameter error if no opts', () => {
            try {
                // eslint-disable-next-line no-new
                new UniResolverClient(null);
                fail('no error thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(ParameterValidationError);
            }
        });
    });

    describe('resolve', () => {
        const resolutionResult = {
            '@context': 'https://w3id.org/did-resolution/v1',
            didDocument: {
                '@context': 'https://www.w3.org/ns/did/v1',
                id: 'did:example:123456789abcdefghi',
                authentication: [
                    {
                        id: 'did:example:123456789abcdefghi#keys-1',
                        type: 'Ed25519VerificationKey2018',
                        controller: 'did:example:123456789abcdefghi',
                        publicKeyBase58: 'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV'
                    }
                ],
                service: [
                    {
                        id: 'did:example:123456789abcdefghi#vcs',
                        type: 'VerifiableCredentialService',
                        serviceEndpoint: 'https://example.com/vc/'
                    }
                ]
            },
            didResolutionMetadata: {
                'content-type': 'application/did+ld+json',
                retrieved: '2024-06-01T19:73:24Z'
            },
            didDocumentMetadata: {
                created: '2019-03-23T06:35:22Z',
                updated: '2023-08-10T13:40:06Z',
                method: {
                    nymResponse: {
                        result: {
                            data:
                                '{"dest":"WRfXPg8dantKVubE3HX8pw","identifier":"V4SGRU86Z58d6TV7PBUe6f","role":"0","seqNo":11,"txnTime":1524055264,"verkey":"H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"}',
                            type: '105',
                            txnTime: 1.524055264e9,
                            seqNo: 11.0,
                            reqId: 1.52725687080231475e18,
                            identifier: 'HixkhyA4dXGz9yxmLQC4PU',
                            dest: 'WRfXPg8dantKVubE3HX8pw'
                        },
                        op: 'REPLY'
                    },
                    attrResponse: {
                        result: {
                            identifier: 'HixkhyA4dXGz9yxmLQC4PU',
                            seqNo: 12.0,
                            raw: 'endpoint',
                            dest: 'WRfXPg8dantKVubE3HX8pw',
                            data: '{"endpoint":{"xdi":"http://127.0.0.1:8080/xdi"}}',
                            txnTime: 1.524055265e9,
                            type: '104',
                            reqId: 1.52725687092557056e18
                        },
                        op: 'REPLY'
                    }
                }
            }
        };
        it('should resolve resolution result', async () => {
            const uniResolver = new UniResolverClient(opt);
            sinon.stub(uniResolver.req, 'get').resolves(resolutionResult);
            const result = await uniResolver.resolve('did:example:123456789abcdefghi');

            expect(result).toBeInstanceOf(ResolutionResult);
            expect(result.didDocument).toEqual(resolutionResult.didDocument);
        });
    });
});

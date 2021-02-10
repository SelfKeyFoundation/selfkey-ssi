import { InvalidDidError } from './errors';
import { parseDidUrl } from './util';
describe('util', () => {
    describe('parseDidUrl', () => {
        const t = (didUrl, expected) => {
            const msg = expected ? `should resolve ${didUrl}` : `should throw error on ${didUrl}`;
            return it(msg, () => {
                if (expected) {
                    expect(parseDidUrl(didUrl)).toEqual(expected);
                } else {
                    expect(() => parseDidUrl(didUrl)).toThrow(InvalidDidError);
                }
            });
        };
        [
            [
                'did:example:testtesttest',
                {
                    did: 'did:example:testtesttest',
                    method: 'example',
                    id: 'testtesttest',
                    path: '',
                    query: {},
                    fragment: ''
                }
            ],
            [
                'did:example:test123/hello/world?q1=123&q2=second#key-1',
                {
                    did: 'did:example:test123',
                    method: 'example',
                    id: 'test123',
                    path: '/hello/world',
                    query: {
                        q1: '123',
                        q2: 'second'
                    },
                    fragment: 'key-1'
                }
            ],
            [
                'did:example:test123/hello/world?q1=123&q2=second#key-1',
                {
                    did: 'did:example:test123',
                    method: 'example',
                    id: 'test123',
                    path: '/hello/world',
                    query: {
                        q1: '123',
                        q2: 'second'
                    },
                    fragment: 'key-1'
                }
            ],
            [
                'did:ethr:rsk:testnet:0xabcabc03e98e0dc2b855be647c39abe984193675',
                {
                    did: 'did:ethr:rsk:testnet:0xabcabc03e98e0dc2b855be647c39abe984193675',
                    method: 'ethr',
                    id: 'rsk:testnet:0xabcabc03e98e0dc2b855be647c39abe984193675',
                    path: '',
                    query: {},
                    fragment: ''
                }
            ],
            [
                'did:example:matrix-test/hello/categories;name=foo/objects;name=green//attributes;name=size/worldcategories;name=foo/objects;name=green//attributes;name=size/1;r=1?q1=123&q2=second#key-1',
                {
                    did: 'did:example:matrix-test',
                    method: 'example',
                    id: 'matrix-test',
                    path:
                        '/hello/categories;name=foo/objects;name=green//attributes;name=size/worldcategories;name=foo/objects;name=green//attributes;name=size/1;r=1',
                    query: {
                        q1: '123',
                        q2: 'second'
                    },
                    fragment: 'key-1'
                }
            ],
            ['did:invalid'],
            ['di:invalid'],
            ['invalid'],
            ['did:invalid:']
        ].map(arg => t(...arg));
    });
});

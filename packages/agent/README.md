# Selfkey Agent

A Selfkey SSI agent library. Utilizes heavily the veramo framework and did-jwt-vc library

For storage typeorm is used.

## Usage

```sh
yarn add @selfkey/agent
```

### Agent example:

```js
const Entities = require('@selfkey/agent/lib/entities').default;
const SelfkeyAgent = require('@selfkey/agent').default;
const {createConnection} = require('typeorm');


async function main(){
    const infuraId = 'INSERT PROJECT ID';

    const dbConnection = createConnection({
        type: 'sqlite',
        database: 'db.sqlite',
        synchronize: true,
        logging: ['error', 'info', 'warn'],
        entities: Entities
    });

    const kmsKey = await SelfkeyAgent.generateKMSKey();

    const agent = new SelfkeyAgent({
            dbConnection,
            infuraId,
            kmsKey,
            agentName: 'example.com,
            didProvider: 'did:web'
        });

    const did = await agent.ensureAgentDID();
    // 'did:web:example.com

    const didDoc = await agent.generateDIDDoc(did);
    /*
    {
      "@context": "https://w3id.org/did/v1",
      "id": "did:web:example.com",
      "publicKey": [
        {
          "id": "did:web:example.com#0409e2da3624c81b9116c9da841b786cef96b7f4af09107d11c16b39fc5607bbf12be877b6fa7e8c570b3fa736e2d98958981403acba77130ce401ef9056bad5ca",
          "type": "Secp256k1VerificationKey2018",
          "controller": "did:web:example.com",
          "publicKeyHex": "0409e2da3624c81b9116c9da841b786cef96b7f4af09107d11c16b39fc5607bbf12be877b6fa7e8c570b3fa736e2d98958981403acba77130ce401ef9056bad5ca"
        }
      ],
      "authentication": [
        {
          "id": "did:web:example.com#0409e2da3624c81b9116c9da841b786cef96b7f4af09107d11c16b39fc5607bbf12be877b6fa7e8c570b3fa736e2d98958981403acba77130ce401ef9056bad5ca",
          "type": "Secp256k1SignatureAuthentication2018",
          "publicKey": "did:web:example.com#0409e2da3624c81b9116c9da841b786cef96b7f4af09107d11c16b39fc5607bbf12be877b6fa7e8c570b3fa736e2d98958981403acba77130ce401ef9056bad5ca",
          "controller": "did:web:example.com"
        }
      ],
      "service": []
    }
    */

   const credentialSubject = {
       firstName: 'First',
       lastName: 'Last',
       nationality: 'Armenia',
       id: 'did:ethr:0xsdasda2dsadasdas...'
   };

   const credential = await agent.issueCredential({credentialSubject});

   const verifiedCredential = await agent.verifyCredential(credential);

   const presentation = await agent.issuePresentation([credential], 'did:web:verifier.com');

   // agent with did 'did:web:verifier.com'

   await agent.verifyPresentation(presentation);

}

```


## Binary

When installing the library, a script executable will be installed as well into `node_modules/.bin`

You can generate a Secret Box private key with it

```sh
sagent-gen-pk

```

## API

```ts
interface ISelfkeyAgentOptions {
    dbConnection: Promise<Connection>;
    infuraId?: string;
    kmsKey?: string;
    kmsName?: string;
    agentName?: string;
    didProvider: 'did:web' | 'did:ethr' | 'did:ethr:ropsten';
}
```

```ts
interface IUnsignedCredential {
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
```

```ts
constructor(private options: ISelfkeyAgentOptions)
```

```ts
static async generateKMSKey(): string
```

Generates a private key that can be used as an input for KMS Secret Box

Used in the `sagent-gen-pk` bin script.

```ts
async importIdentifier(identifier: IIdentifier)
```

Pass trough function for veramo import method

https://github.com/uport-project/veramo/blob/358208519d019d7d90cbefb98911979376c7c056/packages/data-store/src/identifier/did-store.ts#L67

Allows to import an existing identifier to the agent.

If you are importing main agent identifier, please specify the `alias` options the same as `agentName` as provided in constructor.

If no agent name was provided, specify the default `selfkey-agent`

```ts
async ensureAgentDID(options?: object)
```

Returns agent did. If no existing did found, creates a new one.

Please make sure to use `importIdentifier` before calling this function if you want to use an existing key for your agent.

```ts
sync getAgentDIDDocument(options?: object): Promise<DIDDocument | null>
```

Generates a DID document for the agent

```ts
async resolveDIDDoc(didUrl: string): Promise<DIDDocument | null>
```

Uses DID resolver to resolve a DID doc

```ts
async generateDIDDoc(did: string): Promise<DIDDocument | null>
```

Generates a DID doc for a did that is stored in the local store.
Useful for generating DID Documents for non resolvable DID's

```ts
async issueCredential(
        credential: IUnsignedCredential,
        options: {
            save?: boolean;
            proofFormat?: string;
        } = { save: false, proofFormat: 'JWT' }
    ): Promise<VerifiableCredential>
```

Issues a new JWT Verifiable credential

```ts
async issuePresentation(
        credentials: VerifiableCredential[],
        verifierDID: string,
        holderDid?: string,
        options?: { save: boolean }
    ): Promise<VerifiablePresentation>
```

Issues a new JWT verifiable presentation

```ts
async verifyCredential(
        vc: string | VerifiableCredential,
        options?: object
    ): Promise<VerifiedCredential>
```

Verifies a JWT verifiable credential. A VC object or a JWT string can be provided

```ts
async verifyPresentation(
        vp: string | VerifiablePresentation,
        options?: object
    ): Promise<VerifiedPresentation>
```

Verifies a JWT verifiable presentation. A VP object or a JWT string can be provided

```ts
async listCredentials(): Promise<UniqueVerifiableCredential[]>
```

List all credentials stored in local store

```ts
async listCredentialsForSubjectId(id: string): Promise<UniqueVerifiableCredential[]>
```

Lists credentials from local store filtered by subject id

```ts
async listCredentialsForIssuerId(id: string | string[]): Promise<UniqueVerifiableCredential[]>
```

Lists credentials from local store filtered by issuer id

## Tests

From monorepo root directory run `jest agent`

NOTE: verify presentation / credential tests might fail sporadically because they rely on network requests to resolve DID. They should be mocked instead.

## Deploy

Navigate to `packages/agent`

Run `yarn version` to update the package version

Run `git push --tags` to push the new version and tag to the github repo

Then run `yarn publish` to publish the new version to npm

TODO: Deploy process should happen automatically from CI. Also, versioning and deploy should be managed by lerna on the root of the monorepo.

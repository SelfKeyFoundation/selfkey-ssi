# Selfkey Agent

A Selfkey SSI agent library. Utilizes heavily the veramo framework and did-jwt-vc library

## Usage

```sh
yarn add @selfkey/agent
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

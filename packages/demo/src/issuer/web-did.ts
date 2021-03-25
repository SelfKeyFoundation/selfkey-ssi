import { IDIDManager, IKeyManager, TAgent } from '@veramo/core';

export async function getOrCreateIdentifier(
    agent: TAgent<IDIDManager & IKeyManager>,
    alias: string
) {
    try {
        return await agent.didManagerGetByAlias({
            provider: 'did:web',
            alias
        });
    } catch (error) {
        const identifier = await agent.didManagerCreate({
            provider: 'did:web',
            alias
        });

        const edKey = await agent.keyManagerCreate({ type: 'Ed25519', kms: 'local' });

        await agent.didManagerAddKey({ did: identifier.did, key: edKey });

        const didCommServicePrefix = `${identifier.did}#messaging`;

        await agent.didManagerAddService({
            did: identifier.did,
            service: {
                id: `${didCommServicePrefix}-1`,
                type: 'Messaging',
                description: 'didcomm v1 messaging service',
                serviceEndpoint: `https://${decodeURIComponent(alias)}/messaging`
            }
        });

        return await agent.didManagerGet({ did: identifier.did });
    }
}

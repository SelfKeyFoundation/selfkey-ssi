export async function getOrCreateIdentifier(agent: any, alias: string) {
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

        const didCommServicePrefix = `${identifier.did}#didcomm`;

        await agent.didManagerAddService({
            did: identifier.did,
            service: {
                id: `${didCommServicePrefix}-1`,
                type: 'DIDComm',
                description: 'https didcomm endpoint',
                serviceEndpoint: `https://${decodeURIComponent(alias)}/didcomm`
            }
        });

        await agent.didManagerAddService({
            did: identifier.did,
            service: {
                id: `${didCommServicePrefix}-2`,
                type: 'DIDComm',
                description: 'http didcomm endpoint',
                serviceEndpoint: `http://${decodeURIComponent(alias)}/didcomm`
            }
        });

        return await agent.didManagerGet({ did: identifier.did });
    }
}

import { IIdentifier } from '@veramo/core';
import { ISelectiveDisclosureRequest } from '@veramo/selective-disclosure';

type TIssuer = {
    id: string;
    name: string;
};

type TCredential = {
    type: string;
    context: string;
};

type TCredentialManifest = {
    issuer: TIssuer;
    credential: TCredential;
    sdr: ISelectiveDisclosureRequest;
};

export async function getCredentialManifest(identifier: IIdentifier): Promise<TCredentialManifest> {
    const messaging = identifier.services.find(s => s.type === 'Messaging');

    if (!messaging) {
        throw new Error('No messaging endpoint');
    }

    return {
        issuer: {
            id: identifier.did,
            name: 'Super Corporate Registrar'
        },

        credential: {
            type: 'CertificateOfIncorporation',
            context: 'https://platform.selfkey.org/contexts/kyc/v1.jsonld'
        },

        sdr: {
            issuer: identifier.did,
            replyUrl: messaging.serviceEndpoint,
            claims: [
                {
                    reason: 'Please provide your company name',
                    claimType: 'legalName',
                    essential: true
                },
                {
                    reason: 'Please provide legal entity type',
                    claimType: 'legalEntityType',
                    essential: true
                },
                {
                    reason: 'Please provide legal jurisdiction',
                    claimType: 'jurisdiction',
                    essential: true
                },
                {
                    reason: 'Please provide founding date',
                    claimType: 'foundingDate',
                    essential: true
                }
            ]
        }
    };
}

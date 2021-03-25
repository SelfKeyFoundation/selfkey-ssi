import { IIdentifier } from '@veramo/core';
import { ISelectiveDisclosureRequest } from '@veramo/selective-disclosure';

enum EServiceType {
    CORPORATE_BANK_ACCOUNT_OPEN = 'CORPORATE_BANK_ACCOUNT_OPEN'
}

type TRPService = {
    name: string;
    type: EServiceType;
    serviceProvider: string;
    sdr: ISelectiveDisclosureRequest;
};

export async function getServices(identifier: IIdentifier): Promise<TRPService[]> {
    const messaging = identifier.services.find(s => s.type === 'Messaging');

    if (!messaging) {
        throw new Error('No messaging endpoint');
    }

    return [
        {
            name: 'Open Corporate Bank Account',
            type: EServiceType.CORPORATE_BANK_ACCOUNT_OPEN,
            serviceProvider: identifier.did,
            sdr: {
                issuer: identifier.did,
                replyUrl: messaging.serviceEndpoint,
                claims: [
                    {
                        reason: 'Please provide your company name',
                        claimType: 'legalName',
                        essential: true,
                        credentialContext: 'https://platform.selfkey.org/contexts/kyc/v1.jsonld',
                        credentialType: 'CertificateOfIncorporation',
                        issuers: [
                            {
                                did: 'did:web:issuer-selfkey.ngrok.io',
                                url: 'https:////issuer-selfkey.ngrok.io'
                            }
                        ]
                    },
                    {
                        claimType: 'legalEntityType',
                        essential: true,
                        credentialContext: 'https://platform.selfkey.org/contexts/kyc/v1.jsonld',
                        credentialType: 'CertificateOfIncorporation',
                        issuers: [
                            {
                                did: 'did:web:issuer-selfkey.ngrok.io',
                                url: 'https:////issuer-selfkey.ngrok.io'
                            }
                        ]
                    },
                    {
                        claimType: 'jurisdiction',
                        essential: true,
                        credentialContext: 'https://platform.selfkey.org/contexts/kyc/v1.jsonld',
                        credentialType: 'CertificateOfIncorporation',
                        issuers: [
                            {
                                did: 'did:web:issuer-selfkey.ngrok.io',
                                url: 'https:////issuer-selfkey.ngrok.io'
                            }
                        ]
                    },
                    {
                        claimType: 'foundingDate',
                        essential: true,
                        credentialContext: 'https://platform.selfkey.org/contexts/kyc/v1.jsonld',
                        credentialType: 'CertificateOfIncorporation',
                        issuers: [
                            {
                                did: 'did:web:issuer-selfkey.ngrok.io',
                                url: 'https:////issuer-selfkey.ngrok.io'
                            }
                        ]
                    }
                ]
            }
        }
    ];
}

import {
    IDIDManager,
    IResolver,
    IKeyManager,
    IDataStore,
    IMessageHandler,
    IIdentifier,
    TAgent
} from '@veramo/core';
import { IDataStoreORM } from '@veramo/data-store';
import { IDIDComm } from '@veramo/did-comm';
import { ICredentialIssuer } from '@veramo/credential-w3c';
import { ISelectiveDisclosure } from '@veramo/selective-disclosure';

declare global {
    namespace Express {
        export interface Request {
            identity?: IIdentifier;
            agent?: TAgent<
                IDIDManager &
                    IKeyManager &
                    IDataStore &
                    IDataStoreORM &
                    IResolver &
                    IMessageHandler &
                    IDIDComm &
                    ICredentialIssuer &
                    ISelectiveDisclosure
            >;
        }
    }
}

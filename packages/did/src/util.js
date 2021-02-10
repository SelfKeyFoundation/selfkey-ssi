import qs from 'qs';
import { InvalidDidError } from './errors';

export const parseDidUrl = did => {
    const match = /^did:([a-z0-9]+):([a-zA-Z0-9:.\-_]+)([^?#]*)?(\?([^#]*))?(#(.*))?$/.exec(did); // TODO - Check if there are no exceptions to this
    if (!match) {
        throw new InvalidDidError();
    }
    const [, method, id, path = '', , queryString = '', , fragment = ''] = match;

    const query = qs.parse(queryString);

    return {
        did: `did:${method}:${id}`,
        method,
        query,
        path,
        id,
        fragment
    };
};

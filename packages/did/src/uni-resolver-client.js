import axios from 'axios';
import { validate } from 'parameter-validator';
import { ResolutionError } from './errors';
import ResolutionResult from './resolution-result';

class UniResolverClient {
    constructor(opt) {
        const { endpoint } = validate(opt, ['endpoint']);
        this.endpoint = endpoint;
        this.req = axios.create({
            baseURL: `${this.endpoint}/1.0/`
        });
    }

    async resolve(did) {
        try {
            const res = await this.req.get(`identifiers/${did}`);
            return new ResolutionResult(res);
        } catch (error) {
            throw new ResolutionError(error.response.status, error.response.data);
        }
    }
}

export default UniResolverClient;

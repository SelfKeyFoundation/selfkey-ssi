import { InvalidDidError } from './errors';

describe('DID errors', () => {
    describe('Invalid DID error', () => {
        it('should be an error', () => {
            expect(new InvalidDidError()).toBeInstanceOf(Error);
        });

        it('should have a message', () => {
            expect(new InvalidDidError().message).toEqual('Invalid DID');
        });
    });
});

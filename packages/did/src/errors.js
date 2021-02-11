export class InvalidDidError extends Error {
    constructor() {
        super('Invalid DID');
    }
}

export class ResolutionError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

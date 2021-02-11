import { validate } from 'parameter-validator';
class ResolutionResult {
    constructor(resolutionResultDoc) {
        const {
            didDocument,
            didResolutionMetadata,
            didDocumentMetadata
        } = validate(resolutionResultDoc, [
            'didDocument',
            'didResolutionMetadata',
            'didDocumentMetadata'
        ]);

        this.didDocument = didDocument;
        this.didResolutionMetadata = didResolutionMetadata;
        this.didDocumentMetadata = didDocumentMetadata;
    }
}

export default ResolutionResult;

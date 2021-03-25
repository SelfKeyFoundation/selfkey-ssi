import { SecretBox } from '@veramo/kms-local';

async function main() {
    const key = await SecretBox.createSecretKey();
    console.log(key);
}

if (!module.parent) {
    main()
        .then()
        .catch(err => console.error(err));
}

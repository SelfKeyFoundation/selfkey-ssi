import { agent } from './setup';

async function main() {
    const identity = await agent.didManagerCreate();
    console.log(identity);
}

main()
    .then(() => {})
    .catch(console.log);

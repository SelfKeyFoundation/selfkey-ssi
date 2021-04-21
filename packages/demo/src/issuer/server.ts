import config from './config';
import path from 'path';
import express from 'express';
import { getAgentRouters } from './agent';
import { createDBConnection, closeDBConnection } from './db-connection';
import { getOrCreateIdentifier } from './web-did';
import { getCredentialManifest } from './issuer';

async function createApp({ dbConnection }: any) {
    const app = express();
    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, 'views'));
    const agentRouters = getAgentRouters(dbConnection, '/agent');

    app.use('/.well-known/did.json', async (req, res, next) => {
        try {
            await getOrCreateIdentifier(await agentRouters.getAgentForRequest(req), req.hostname);
        } catch (error) {
            console.error(error);
        }
        next();
    });
    app.use('/agent', agentRouters.agentRouter);
    app.use('/open-api.json', agentRouters.apiSchemaRouter);
    app.use(agentRouters.didDocRouter);

    app.get('/.well-known/issuer.json', async (req, res, next) => {
        const identity = await getOrCreateIdentifier(
            await agentRouters.getAgentForRequest(req),
            req.hostname
        );
        res.json(await getCredentialManifest(identity));
    });

    app.get('/', (req, res) => {
        res.render('index');
    });

    return app;
}

export async function startServer() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        const dbConnection: any = createDBConnection();
        const app = await createApp({ dbConnection });
        const restServer = app.listen(config.port, () => {
            console.log('listening on ' + config.port);
            resolve({ restServer, app, dbConnection });
        });
    });
}

export async function stopServer(server: any) {
    server.restServer.close();
    await closeDBConnection(server.dbConnection);
}

async function main() {
    const server = await startServer();

    process.on('SIGTERM', async () => {
        console.log('SIGTERM received! Shutting down.');
        await stopServer(server);
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        console.log('SIGINT received! Shutting down.');
        await stopServer(server);
        process.exit(0);
    });
}

if (!module.parent) {
    main().then();
}

const { Client } = require('pg');
import makeSessionDb from './sessionDb';
import makeUserDb from './userDb';
import makeSceneDb from './sceneDb';

const sessionDb = makeSessionDb({ getDbInstance });
const userDb = makeUserDb({ getDbInstance });
const sceneDb = makeSceneDb({ getDbInstance });


async function getDbInstance() {
    let client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DATABASE,
    });

    client.connect();

    return client;
}

export default { sessionDb, userDb, sceneDb };

export { sessionDb, userDb, sceneDb };
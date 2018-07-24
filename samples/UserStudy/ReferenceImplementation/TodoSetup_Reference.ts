// @ts-check
'use strict';
console.log();
console.log('TODO SETUP');
console.log('===================');
console.log();

import * as cosmos from '../../../lib/';
const config = require('../../Shared/config');
  
const endpoint = config.connection.endpoint;
const masterKey = config.connection.authKey;

const CosmosClient = cosmos.CosmosClient;
const databaseId = 'UserStudy_TodoDB'
const containerId = 'UserStudy_TodoContainer'

/* TASK 1: CREATE A NEW DATABASE **/

// 1a. Establish a new instance of CosmosClient to be used in this setup
const client = new CosmosClient({endpoint: endpoint, auth: { masterKey }});

// 1b. Implement a function createDatabaseIfNotExists() to read a database to see if it exists, create a new one if it does not, and print its ID
async function createDatabaseIfNotExists() {
    try {
        const {database} = await client.database(databaseId).read();
        console.log('Database with uri of \'dbs/' + database.id + '\' was found');
    }
    catch(error) {
        /** @type{cosmos.ErrorResponse} */
        const err: cosmos.ErrorResponse = error;
        if(err.code === 404) {
            console.log('Creating new database \'dbs/' + databaseId);
            await client.databases.create({id: databaseId});
        } else {
            throw err;
        }
    }
}

/** TASK 2: CREATE A NEW CONTAINER **/

// 2a. Implement a function createContainerIfNotExists() to read a container to see if it exists, create a new one if it does not, and print its name
async function createContainerIfNotExists() {
    const database = await client.database(databaseId);
    try {
        const {container} = await database.container(containerId).read();
        console.log('Container with id \'' + container.id + ' was found' );
    }
    catch (error) {
        /** @type{cosmos.ErrorResponse} */
        const err: cosmos.ErrorResponse = error;
        if(err.code === 404) {
            console.log('Creating new container \'container/' + containerId);
            await database.containers.create({id: containerId});
        } else {
            throw err;
        }
    }
}

function handleError(error: cosmos.ErrorResponse) {
    console.log();
    console.log('An error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);
    console.log();
    
    finish();
}

function finish() {
    console.log();
    console.log('End of setup.');
}

async function run() {
    await createDatabaseIfNotExists().catch(handleError).then(finish);
    await createContainerIfNotExists().catch(handleError).then(finish);
}

run().then(finish).catch(handleError);




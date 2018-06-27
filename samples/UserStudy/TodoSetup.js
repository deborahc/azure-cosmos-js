// @ts-check
'use strict';
console.log();
console.log('TODO SETUP');
console.log('===================');
console.log();

const cosmos = require('../../lib/');
const config = require('../Shared/config')
  
const host = config.connection.endpoint;
const masterKey = config.connection.authKey;

const CosmosClient = cosmos.CosmosClient;
const databaseId = 'UserStudy_TodoDB'
const containerId = 'UserStudy_TodoContainer'

/** TASK 1: CREATE A NEW DATABASE **/

// 1a. TODO: Establish a new instance of CosmosClient to be used in this setup

// 1b. TODO: Implement a function createDatabaseIfNotExists() to read a database to see if it exists, create a new one if it does not, and print its id
async function createDatabaseIfNotExists() {
    try {

    }
    catch(error) {
        /** @type{cosmos.ErrorResponse} */
        const err = error;
    }

    //1c: TODO: Read the database and print out its id
    console.log('Database with uri of \'dbs/' + "TODO" + '\' was found');
}

/** TASK 2: CREATE A NEW COLLECTION **/

// 2a. TODO: Implement a function createContainerIfNotExists() to read a container to see if it exists, create a new one if it does not, and print its name
async function createContainerIfNotExists() {
    try {

    }
    catch (error) {
        /** @type{cosmos.ErrorResponse} */
        const err = error;
    }
    //2b: TODO: Read the container and print out its id
    console.log('Container with id \'' + "TODO" + ' was found' );
}

function handleError(error) {
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




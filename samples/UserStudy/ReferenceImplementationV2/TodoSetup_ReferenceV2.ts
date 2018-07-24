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

/* TASK 1: CREATE A NEW DATABASE AND CONTAINER **/

// 1a. Establish a new instance of CosmosClient to be used in this setup
const client = new CosmosClient({ endpoint: endpoint, auth: { masterKey } });

// 1b. Implement a function setup() to create a database and container. The database and container do not currently exist. 

async function setup() {
    try {
        const { database } = await client.databases.createIfNotExists({ id: databaseId });
        const { container } = await database.containers.createIfNotExists({ id: containerId });
        console.log('Database with uri of \'dbs/' + database.id + '\' was created');
        console.log('Container with id \'' + container.id + ' was created');
    }
    catch (error) {
        /** @type{cosmos.ErrorResponse} */
        const err: cosmos.ErrorResponse = error;
    }
}

/* TASK 2: ADD ITEMS TO THE CONTAINER AND LIST THEM **/

// 2a. Implement a function to add a new todo-item to the container in the database

async function addToDoItem(category: string, description: string) {
    try {
        const container = client.database(databaseId).container(containerId);
        console.log("Adding task with category: " + category + " and description: " + description);
        const item = { "category": category, "description": description };
        container.items.create(item);
    } catch (error) {
        /** @type{cosmos.ErrorResponse} */
        const err: cosmos.ErrorResponse = error;
    }
}

// 2b. Implement a function to list all todo-items in the container in the database

async function queryAllToDoItems() {
    try {
        const container = client.database(databaseId).container(containerId);
        const { result: items } = await container.items.readAll().toArray();
        for (let item of items) {
            console.log(item.category, item.description);
        }
    } catch (error) {
        /** @type{cosmos.ErrorResponse} */
        const err: cosmos.ErrorResponse = error;

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

async function runTask1() {
    await setup().catch(handleError).then(finish);
}

async function runTask2() {
    const category = "Errand";
    const description = "Pick up library book";
    await addToDoItem(category, description).catch(handleError);
    await queryAllToDoItems().catch(handleError);
}

runTask1().catch(handleError);
//runTask2().catch(handleError);


#!/usr/bin/env node
const cosmos = require('../../../lib/');
const config = require('../../Shared/config')

const host = config.connection.endpoint;
const masterKey = config.connection.authKey;

const CosmosClient = cosmos.CosmosClient;
const databaseId = 'UserStudy_TodoDB'
const containerId = 'UserStudy_TodoContainer'

const client = new CosmosClient({ endpoint: host, auth: { masterKey } });

var program = require('commander');

/** TASK 1: Implement a function to add a new todo-item to the container in the database **/

async function addToDoItem(category, description) {
    try {
        const container =  client.databases.get(databaseId).containers.get(containerId);
        console.log("Adding task with category: " + category + " and description: " + description);
        const item = { "category": category, "description": description };
        container.items.create(item);
    } catch (error) {
        /** @type{cosmos.ErrorResponse} */
        const err = error;
    }
}

/** TASK 2: Implement a function to list all todo-items in the container in the database **/

async function queryAllToDoItems() {
    try {
        const container =  client.databases.get(databaseId).containers.get(containerId);
        const { result: items } = await container.items.readAll().toArray();
        for (let item of items) {
            console.log(item.category, item.description);
        }
    } catch (error) {
        /** @type{cosmos.ErrorResponse} */
        const err = error;
    }
}

/** TASK 2: Implement a function to list all todo-items in the container in the database **/

async function handleError(error) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);
}

// To run: node .\TodoCLI.js add <category> <description>
program
    .command('add <category> <description>')
    .description('Add a todo-item with category and description')
    .action(function (category, description, args) {
        addToDoItem(category, description).catch(handleError);
    });

// To run: node .\TodoCLI.js list
program
    .command('list') 
    .description('List all todo-items')
    .action(function (args) {
        queryAllToDoItems().catch(handleError);
    });

program.parse(process.argv);

// async function run() {
//     const category = "Errand";
//     const description = "Pick up library book";
//     await addToDoItem(category,description).catch(handleError);
//     await queryAllToDoItems().catch(handleError);
// }

//run().catch(handleError);

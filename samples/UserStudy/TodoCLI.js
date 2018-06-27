#!/usr/bin/env node
const cosmos = require('../../lib/');
const config = require('../Shared/config')

const host = config.connection.endpoint;
const masterKey = config.connection.authKey;

const CosmosClient = cosmos.CosmosClient;
const databaseId = 'UserStudy_TodoDB'
const containerId = 'UserStudy_TodoContainer'

const client = new CosmosClient({ endpoint: host, auth: { masterKey } });

var program = require('commander');

/** TASK 1: TODO: Implement a function to add a new todo-item to the container in the database **/

async function addToDoItem(category, description) {

}

/** TASK 2: TODO: Implement a function to list all todo-items in the container in the database **/

async function queryAllToDoItems() {

}

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

// To run: .\TodoCLI.js list
program
    .command('list') 
    .description('List all todo-items')
    .action(function (args) {
        queryAllToDoItems().catch(handleError);
    });

program.parse(process.argv);
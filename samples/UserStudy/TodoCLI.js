#!/usr/bin/env node

var program = require('commander');

//QueryAllToDoItems make it a function. 
//Future: do a simple query, (write out the sql)
//Add and mark as completed - 

program
    .command('list') // sub-command name
    .description('List all todo-items') // command description

    // function to execute when command is uses
    .action(function () {
        //TASK: Query database / container for all todo items and list them. 
    });

//dech-todo: move this first
program
    .command('add <category> <description>')
    .description('Add a todo-item with category and description')
    .action(function (category, description, args) {
        console.log("Adding task with category: "+ category + " and description: " + description);

        //TASK: Add the new todo-item to the database
    });

// allow commander to parse `process.argv`
program.parse(process.argv);

//TO RUN, go to Terminal, and type: node .\TodoCLI.js add categoryText descriptionText
import * as assert from "assert";
import * as Stream from "stream";
import {
    AzureDocuments, Base, Constants, CosmosClient,
    DocumentBase, HashPartitionResolver, Range,
    RangePartitionResolver, Response, RetryOptions,
} from "../../";
import { Container, StoredProcedureDefinition } from "../../client";
import testConfig from "./../common/_testConfig";
import { TestHelpers } from "./../common/TestHelpers";

// Used for sproc
declare var getContext: any;

// TODO: should fix long lines
// tslint:disable:max-line-length

const endpoint = testConfig.host;
const masterKey = testConfig.masterKey;
const client = new CosmosClient({
    endpoint,
    auth: { masterKey },
});

describe("NodeJS CRUD Tests", function () {
    this.timeout(process.env.MOCHA_TIMEOUT || 10000);
    // remove all databases from the endpoint before each test
    beforeEach(async function () {
        this.timeout(10000);
        await TestHelpers.removeAllDatabases(client);
    });
    describe("Validate sproc CRUD", function () {
        let container: Container;
        beforeEach(async function() {
            container = await TestHelpers.getTestContainer(client, this.test.fullTitle());
        });

        it("nativeApi Should do sproc CRUD operations successfully with create/replace", async function () {
            // read sprocs
            const { result: sprocs } = await container.storedProcedures.readAll().toArray();
            assert.equal(sprocs.constructor, Array, "Value should be an array");

            // create a sproc
            const beforeCreateSprocsCount = sprocs.length;
            const sprocDefinition: StoredProcedureDefinition = {
                id: "sample sproc",
                body: "function () { const x = 10; }",
            };

            const { result: sproc } = await container.storedProcedures.create(sprocDefinition);

            assert.equal(sproc.id, sprocDefinition.id);
            assert.equal(sproc.body, "function () { const x = 10; }");

            // read sprocs after creation
            const { result: sprocsAfterCreation } = await container.storedProcedures.readAll().toArray();
            assert.equal(sprocsAfterCreation.length, beforeCreateSprocsCount + 1, "create should increase the number of sprocs");

            // query sprocs
            const querySpec = {
                query: "SELECT * FROM root r",
            };
            const { result: queriedSprocs } = await container.storedProcedures.query(querySpec).toArray();
            assert(queriedSprocs.length > 0, "number of sprocs for the query should be > 0");

            // replace sproc
            sproc.body = function () { const x = 20; };
            const { result: replacedSproc } = await container.storedProcedures.get(sproc.id).replace(sproc);

            assert.equal(replacedSproc.id, sproc.id);
            assert.equal(replacedSproc.body, "function () { const x = 20; }");

            // read sproc
            const { result: sprocAfterReplace } = await container.storedProcedures.get(replacedSproc.id).read();
            assert.equal(replacedSproc.id, sprocAfterReplace.id);

            // delete sproc
            await container.storedProcedures.get(replacedSproc.id).delete();

            // read sprocs after deletion
            try {
                await container.storedProcedures.get(replacedSproc.id).read();
                assert.fail("Must fail to read sproc after deletion");
            } catch (err) {
                const notFoundErrorCode = 404;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }
        });

        it("nativeApi Should do sproc CRUD operations successfully name based with upsert", async function () {
                   // read sprocs
            const { result: sprocs } = await container.storedProcedures.readAll().toArray();
            assert.equal(sprocs.constructor, Array, "Value should be an array");

            // create a sproc
            const beforeCreateSprocsCount = sprocs.length;
            const sprocDefinition: StoredProcedureDefinition = {
                id: "sample sproc",
                // tslint:disable-next-line:object-literal-shorthand
                body: function() { const x = 10; },
            };

            const { result: sproc } = await container.storedProcedures.upsert(sprocDefinition);

            assert.equal(sproc.id, sprocDefinition.id);
            assert.equal(sproc.body, "function () { const x = 10; }");

            // read sprocs after creation
            const { result: sprocsAfterCreation } = await container.storedProcedures.readAll().toArray();
            assert.equal(sprocsAfterCreation.length, beforeCreateSprocsCount + 1, "create should increase the number of sprocs");

            // query sprocs
            const querySpec = {
                query: "SELECT * FROM root r",
            };
            const { result: queriedSprocs } = await container.storedProcedures.query(querySpec).toArray();
            assert(queriedSprocs.length > 0, "number of sprocs for the query should be > 0");

            // replace sproc
            sproc.body = function () { const x = 20; };
            const { result: replacedSproc } = await container.storedProcedures.upsert(sproc);

            assert.equal(replacedSproc.id, sproc.id);
            assert.equal(replacedSproc.body, "function () { const x = 20; }");

            // read sproc
            const { result: sprocAfterReplace } = await container.storedProcedures.get(replacedSproc.id).read();
            assert.equal(replacedSproc.id, sprocAfterReplace.id);

            // delete sproc
            await container.storedProcedures.get(replacedSproc.id).delete();

            // read sprocs after deletion
            try {
                await container.storedProcedures.get(replacedSproc.id).read();
                assert.fail("Must fail to read sproc after deletion");
            } catch (err) {
                const notFoundErrorCode = 404;
                assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
            }
        });
    });

    describe("Validate stored procedure functionality", function () {
        let container: Container;
        beforeEach(async function() {
            container = await TestHelpers.getTestContainer(client, this.test.fullTitle());
        });

        it("nativeApi should do stored procedure operations successfully with create/replace", async function () {
            // tslint:disable:no-var-keyword
            // tslint:disable:prefer-const
            // tslint:disable:curly
            // tslint:disable:no-string-throw
            // tslint:disable:object-literal-shorthand
            const sproc1: StoredProcedureDefinition = {
                id: "storedProcedure1",
                body: function () {
                    for (var i = 0; i < 1000; i++) {
                        const item = getContext().getResponse().getBody();
                        if (i > 0 && item !== i - 1) throw "body mismatch";
                        getContext().getResponse().setBody(i);
                    }
                },
            };

            const sproc2: StoredProcedureDefinition = {
                    id: "storedProcedure2",
                    body: function () {
                        for (var i = 0; i < 10; i++) getContext().getResponse().appendValue("Body", i);
                    },
                };

            const sproc3: StoredProcedureDefinition = {
                    id: "storedProcedure3",
                    // TODO: I put any in here, but not sure how this will work...
                    body: function (input: any) {
                        getContext().getResponse().setBody("a" + input.temp);
                    },
                };

                // tslint:enable:no-var-keyword
                // tslint:enable:prefer-const
                // tslint:enable:curly
                // tslint:enable:no-string-throw
                // tslint:enable:object-literal-shorthand

            const { result: retrievedSproc } = await container.storedProcedures.create(sproc1);
            const { result: result } = await container.storedProcedures.get(retrievedSproc.id).execute();
            assert.equal(result, 999);

            const { result: retrievedSproc2 } = await container.storedProcedures.create(sproc2);
            const { result: result2 } = await container.storedProcedures.get(retrievedSproc2.id).execute();
            assert.equal(result2, 123456789);
            const { result: retrievedSproc3 } = await container.storedProcedures.create(sproc3);
            const { result: result3 } = await container.storedProcedures.get(retrievedSproc3.id).execute([{ temp: "so" }]);
            assert.equal(result3, "aso");
        });

        it("nativeApi Should do stored procedure operations successfully with upsert", async function () {
            // tslint:disable:no-var-keyword
            // tslint:disable:prefer-const
            // tslint:disable:curly
            // tslint:disable:no-string-throw
            // tslint:disable:object-literal-shorthand
            const sproc1: StoredProcedureDefinition = {
                id: "storedProcedure1",
                body: function () {
                    for (var i = 0; i < 1000; i++) {
                        const item = getContext().getResponse().getBody();
                        if (i > 0 && item !== i - 1) throw "body mismatch";
                        getContext().getResponse().setBody(i);
                    }
                },
            };

            const sproc2: StoredProcedureDefinition = {
                    id: "storedProcedure2",
                    body: function () {
                        for (var i = 0; i < 10; i++) getContext().getResponse().appendValue("Body", i);
                    },
                };

            const sproc3: StoredProcedureDefinition = {
                    id: "storedProcedure3",
                    // TODO: I put any in here, but not sure how this will work...
                    body: function (input: any) {
                        getContext().getResponse().setBody("a" + input.temp);
                    },
                };

            // tslint:enable:no-var-keyword
            // tslint:enable:prefer-const
            // tslint:enable:curly
            // tslint:enable:no-string-throw
            // tslint:enable:object-literal-shorthand

            const { result: retrievedSproc } = await container.storedProcedures.upsert(sproc1);
            const { result: result } = await container.storedProcedures.get(retrievedSproc.id).execute();
            assert.equal(result, 999);

            const { result: retrievedSproc2 } = await container.storedProcedures.upsert(sproc2);
            const { result: result2 } = await container.storedProcedures.get(retrievedSproc2.id).execute();
            assert.equal(result2, 123456789);
            const { result: retrievedSproc3 } = await container.storedProcedures.upsert(sproc3);
            const { result: result3 } = await container.storedProcedures.get(retrievedSproc3.id).execute([{ temp: "so" }]);
            assert.equal(result3, "aso");
        });
    });

    it("nativeApi Should execute stored procedure with partition key successfully name based", async function () {
        const { result: db } = await client.databases.create({ id: "sproc test database" });
        // create container
        const partitionKey = "key";

        const containerDefinition = {
            id: "coll1",
            partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
        };

        const { result: containerResult } = await client.databases.get(db.id).containers.create(containerDefinition, { offerThroughput: 12000 });
        const container = await client.databases.get(db.id).containers.get(containerResult.id);

        // tslint:disable:no-var-keyword
        // tslint:disable:prefer-const
        // tslint:disable:curly
        // tslint:disable:no-string-throw
        // tslint:disable:no-shadowed-variable
        // tslint:disable:object-literal-shorthand
        const querySproc = {
            id: "querySproc",
            body: function () {
                var context = getContext();
                var container = context.getContainer();
                var response = context.getResponse();

                // query for players
                var query = "SELECT r.id, r.key, r.prop FROM r";
                var accept = container.queryDocuments(container.getSelfLink(), query, {}, function (err: any, documents: any, responseOptions: any) {
                    if (err) throw new Error("Error" + err.message);
                    response.setBody(documents);
                });

                if (!accept) throw "Unable to read player details, abort ";
            },
        };
        // tslint:enable:no-var-keyword
        // tslint:enable:prefer-const
        // tslint:enable:curly
        // tslint:enable:no-string-throw
        // tslint:enable:no-shadowed-variable
        // tslint:enable:object-literal-shorthand

        const documents = [
            { id: "document1" },
            { id: "document2", key: null, prop: 1 },
            { id: "document3", key: false, prop: 1 },
            { id: "document4", key: true, prop: 1 },
            { id: "document5", key: 1, prop: 1 },
            { id: "document6", key: "A", prop: 1 },
        ];

        const returnedDocuments = await TestHelpers.bulkInsertItems(container, documents);
        const { result: sproc } = await container.storedProcedures.create(querySproc);
        const { result: result } = await container.storedProcedures.get(sproc.id).execute([], { partitionKey: null });
        assert(result !== undefined);
        assert.equal(result.length, 1);
        assert.equal(JSON.stringify(result[0]), JSON.stringify(documents[1]));

        const { result: result2 } = await container.storedProcedures.get(sproc.id).execute(null, { partitionKey: 1 });
        assert(result2 !== undefined);
        assert.equal(result2.length, 1);
        assert.equal(JSON.stringify(result2[0]), JSON.stringify(documents[4]));
    });

    it("nativeApi Should enable/disable script logging while executing stored procedure", async function () {
        // create database
        const { result: db } = await client.databases.create({ id: "sproc test database" });
        // create container
        const { result: containerResult } = await client.databases.get(db.id).containers.create({ id: "sample container" });

        const container = await client.databases.get(db.id).containers.get(containerResult.id);

         // tslint:disable:curly
         // tslint:disable:no-string-throw
         // tslint:disable:no-shadowed-variable
         // tslint:disable:one-line
         // tslint:disable:object-literal-shorthand
        const sproc1 = {
             id: "storedProcedure",
             body: function () {
                 const mytext = "x";
                 const myval = 1;
                 try {
                     console.log("The value of %s is %s.", mytext, myval);
                     getContext().getResponse().setBody("Success!");
                 }
                 catch (err) {
                     getContext().getResponse().setBody("inline err: [" + err.number + "] " + err);
                 }
             },
         };

         // tslint:enable:curly
         // tslint:enable:no-string-throw
         // tslint:enable:no-shadowed-variable
         // tslint:enable:one-line
         // tslint:enable:object-literal-shorthand

        const { result: retrievedSproc } = await container.storedProcedures.create(sproc1);
        const { result: result1, headers: headers1 } = await container.storedProcedures.get(retrievedSproc.id).execute();
        assert.equal(result1, "Success!");
        assert.equal(headers1[Constants.HttpHeaders.ScriptLogResults], undefined);

        let requestOptions = { enableScriptLogging: true };
        const { result: result2, headers: headers2 } = await container.storedProcedures.get(retrievedSproc.id).execute([], requestOptions);
        assert.equal(result2, "Success!");
        assert.equal(headers2[Constants.HttpHeaders.ScriptLogResults],  encodeURIComponent("The value of x is 1."));

        requestOptions = { enableScriptLogging: false };
        const { result: result3, headers: headers3 } =  await container.storedProcedures.get(retrievedSproc.id).execute([], requestOptions);
        assert.equal(result3, "Success!");
        assert.equal(headers3[Constants.HttpHeaders.ScriptLogResults], undefined);

     });
});

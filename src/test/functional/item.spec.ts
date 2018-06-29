import * as assert from "assert";
import {
    Container,
    CosmosClient,
    Database,
    DocumentBase,
} from "../../";
import testConfig from "./../common/_testConfig";
import { TestHelpers } from "./../common/TestHelpers";

const endpoint = testConfig.host;
const masterKey = testConfig.masterKey;

describe("NodeJS CRUD Tests", function () {
    this.timeout(process.env.MOCHA_TIMEOUT || 10000);
    // remove all databases from the endpoint before each test
    beforeEach(async function () {
        this.timeout(10000);
        try {
            await TestHelpers.removeAllDatabases(new CosmosClient({ endpoint, auth: { masterKey } }));
        } catch (err) {
            throw err;
        }
    });

    describe("Validate Document CRUD", function () {
        const documentCRUDTest = async function (isUpsertTest: boolean) {
            try {
                const client = new CosmosClient({ endpoint, auth: { masterKey } });
                // create database
                const { result: dbdef } = await client.databases.create({ id: "sample 中文 database" });
                const db: Database = client.databases.get(dbdef.id);
                // create container
                const { result: containerdef } =
                    await db.containers.create({ id: "sample container" });
                const container: Container = db.containers.get(containerdef.id);

                // read items
                const { result: items } = await container.items.readAll().toArray();
                assert(Array.isArray(items), "Value should be an array");

                // create an item
                const beforeCreateDocumentsCount = items.length;
                const itemDefinition = {
                    name: "sample document",
                    foo: "bar",
                    key: "value",
                    replace: "new property",
                };
                try {
                    await TestHelpers.createOrUpsertItem(container, itemDefinition,
                        { disableAutomaticIdGeneration: true }, isUpsertTest);
                    assert.fail("id generation disabled must throw with invalid id");
                } catch (err) {
                    assert(err !== undefined, "should throw an error because automatic id generation is disabled");
                }
                const { result: document } = await TestHelpers.createOrUpsertItem(
                    container, itemDefinition, undefined, isUpsertTest);
                assert.equal(document.name, itemDefinition.name);
                assert(document.id !== undefined);
                // read documents after creation
                const { result: documents2 } = await container.items.readAll().toArray();
                assert.equal(documents2.length, beforeCreateDocumentsCount + 1,
                    "create should increase the number of documents");
                // query documents
                const querySpec = {
                    query: "SELECT * FROM root r WHERE r.id=@id",
                    parameters: [
                        {
                            name: "@id",
                            value: document.id,
                        },
                    ],
                };
                const { result: results } = await container.items.query(querySpec).toArray();
                assert(results.length > 0, "number of results for the query should be > 0");
                const { result: results2 } = await container.items.query(
                    querySpec, { enableScanInQuery: true }).toArray();
                assert(results2.length > 0, "number of results for the query should be > 0");

                // replace document
                document.name = "replaced document";
                document.foo = "not bar";
                const { result: replacedDocument } = await TestHelpers.replaceOrUpsertItem(
                    container, document, undefined, isUpsertTest);
                assert.equal(replacedDocument.name, "replaced document", "document name property should change");
                assert.equal(replacedDocument.foo, "not bar", "property should have changed");
                assert.equal(document.id, replacedDocument.id, "document id should stay the same");
                // read document
                const { result: document2 } = await container.items.get(replacedDocument.id).read();
                assert.equal(replacedDocument.id, document.id);
                // delete document
                const { result: res } = await container.items.get(replacedDocument.id).delete();

                // read documents after deletion
                try {
                    const { result: document3 } = await container.items.get(replacedDocument.id).read();
                    assert.fail("must throw if document doesn't exist");
                } catch (err) {
                    const notFoundErrorCode = 404;
                    assert.equal(err.code, notFoundErrorCode, "response should return error code 404");
                }
            } catch (err) {
                throw err;
            }
        };

        const documentCRUDMultiplePartitionsTest = async function () {
            try {
                const client = new CosmosClient({endpoint, auth: { masterKey }});
                // create database
                const { result: dbdef } = await client.databases.create({ id: "db1" });
                const db = client.databases.get(dbdef.id);
                const partitionKey = "key";

                // create collection
                const collectionDefinition = {
                    id: "coll1",
                    partitionKey: { paths: ["/" + partitionKey], kind: DocumentBase.PartitionKind.Hash },
                };

                const { result: containerdef } =
                    await db.containers.create(collectionDefinition, { offerThroughput: 12000 });
                const container = db.containers.get(containerdef.id);

                const documents = [
                    { id: "document1" },
                    { id: "document2", key: null, prop: 1 },
                    { id: "document3", key: false, prop: 1 },
                    { id: "document4", key: true, prop: 1 },
                    { id: "document5", key: 1, prop: 1 },
                    { id: "document6", key: "A", prop: 1 },
                ];

                let returnedDocuments =
                    await TestHelpers.bulkInsertItems(container, documents);

                assert.equal(returnedDocuments.length, documents.length);
                returnedDocuments.sort(function (doc1, doc2) {
                    return doc1.id.localeCompare(doc2.id);
                });
                await TestHelpers.bulkReadItems(container, returnedDocuments, partitionKey);
                const { result: successDocuments } = await container.items.readAll().toArray();
                assert(successDocuments !== undefined, "error reading documents");
                assert.equal(successDocuments.length, returnedDocuments.length,
                    "Expected " + returnedDocuments.length + " documents to be succesfully read");
                successDocuments.sort(function (doc1, doc2) {
                    return doc1.id.localeCompare(doc2.id);
                });
                assert.equal(JSON.stringify(successDocuments), JSON.stringify(returnedDocuments),
                    "Unexpected documents are returned");

                returnedDocuments.forEach(function (document) { ++document.prop; });
                const newReturnedDocuments =
                    await TestHelpers.bulkReplaceItems(container, returnedDocuments);
                returnedDocuments = newReturnedDocuments;
                await TestHelpers.bulkQueryItemsWithPartitionKey(container, returnedDocuments, partitionKey);
                const querySpec = {
                    query: "SELECT * FROM Root",
                };
                try {
                    const { result: badUpdate } = await container.items.query(
                        querySpec, { enableScanInQuery: true }).toArray();
                    assert.fail("Must fail");
                } catch (err) {
                    const badRequestErrorCode = 400;
                    assert.equal(err.code, badRequestErrorCode,
                        "response should return error code " + badRequestErrorCode);
                }
                const { result: results } = await container.items.query(
                    querySpec, { enableScanInQuery: true, enableCrossPartitionQuery: true }).toArray();
                assert(results !== undefined, "error querying documents");
                results.sort(function (doc1, doc2) {
                    return doc1.id.localeCompare(doc2.id);
                });
                assert.equal(results.length, returnedDocuments.length,
                    "Expected " + returnedDocuments.length + " documents to be succesfully queried");
                assert.equal(JSON.stringify(results), JSON.stringify(returnedDocuments), "Unexpected query results");

                await TestHelpers.bulkDeleteItems(
                    container, returnedDocuments, partitionKey);
            } catch (err) {
                throw err;
            }
        };

        it("nativeApi Should do document CRUD operations successfully name based", async function () {
            try {
                await documentCRUDTest(false);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do document CRUD operations successfully name based with upsert", async function () {
            try {
                await documentCRUDTest(true);
            } catch (err) {
                throw err;
            }
        });

        it("nativeApi Should do document CRUD operations over multiple partitions", async function () {
            await documentCRUDMultiplePartitionsTest();
        });
    });
});

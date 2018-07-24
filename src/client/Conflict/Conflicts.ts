import { CosmosClient } from "../../CosmosClient";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions } from "../../request";
import { Container } from "../Container";
import { ConflictDefinition } from "./ConflictDefinition";

/**
 * Use to query or read all conflicts.
 *
 * @see {@link Conflict} to read or delete a given {@link Conflict} by id.
 */
export class Conflicts {
  private client: CosmosClient;
  constructor(public readonly container: Container) {
    this.client = this.container.database.client;
  }

  public query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<ConflictDefinition> {
    return this.client.documentClient.queryConflicts(this.container.url, query, options);
  }

  public readAll(options?: FeedOptions): QueryIterator<ConflictDefinition> {
    return this.client.documentClient.readConflicts(this.container.url, options);
  }
}

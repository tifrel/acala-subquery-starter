Starting the indexing service yields:

```log
postgres_1        | 2021-09-30 17:27:00.731 UTC [73] ERROR:  foreign key constraint "accounts_sent_transfers_id_fkey" cannot be implemented
postgres_1        | 2021-09-30 17:27:00.731 UTC [73] DETAIL:  Key columns "sent_transfers_id" and "id" are of incompatible types: jsonb and text.
postgres_1        | 2021-09-30 17:27:00.731 UTC [73] STATEMENT:  CREATE TABLE IF NOT EXISTS "public"."accounts" ("id" text NOT NULL , "public_address" text NOT NULL, "sent_transfers_id" JSONB NOT NULL REFERENCES "public"."token_transfers" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, "recv_transfers_id" JSONB NOT NULL REFERENCES "public"."token_transfers" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));
```

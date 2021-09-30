Trying to access the Karura network yields following lines in the docker output:

```log
subquery-node_1   | 2021-09-30 17:01:15        REGISTRY: Unable to resolve type CurrencyId, it will fail on construction
subquery-node_1   | 2021-09-30 17:01:15        API/INIT: Error: FATAL: Unable to initialize the API: createType(CurrencyId):: DoNotConstruct: Cannot construct unknown type CurrencyId
subquery-node_1   |     at EventEmitter.value (/usr/local/lib/node_modules/@subql/node/node_modules/@polkadot/api/base/Init.cjs:82:25)
subquery-node_1   |     at processTicksAndRejections (internal/process/task_queues.js:95:5)
```

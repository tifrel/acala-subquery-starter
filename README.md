A few notes:

- This way should be quite duplication-free. Of course you could always
  recompute means, totals, and medians, but the task was to index those.
- I originally tried to simply save `account.sentKar` and `account.recvKar` as
  an `Array<bigint>`, which did not work!
  - I guess there is either some problem with storing a JS array into postgres,
    or a problem with storing `bigint`
- I get a quite reliable connection drop from the Mandala endpoint. Might be
  that I fetch to many blocks at once and hit some API limit.

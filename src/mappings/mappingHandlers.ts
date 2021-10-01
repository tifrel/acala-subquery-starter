import { SubstrateEvent } from "@subql/types";
import { Account, TokenTransfer } from "../types";
// import { Balance } from "@polkadot/types/interfaces";

async function getAccount(address: string): Promise<Account> {
  let account = await Account.get(address);
  if (!account) {
    account = new Account(address);

    account.sentKarMean = BigInt(0);
    account.sentKarTotal = BigInt(0);
    account.sentKarMedian = BigInt(0);
    account.recvKarMean = BigInt(0);
    account.recvKarTotal = BigInt(0);
    account.recvKarMedian = BigInt(0);
    await account.save();
  }
  return account;
}

export async function handleCurrencyTransferEvent(
  event: SubstrateEvent
): Promise<void> {
  const {
    event: {
      data: [tokenCodec, fromCodec, toCodec, amountCodec],
    },
  } = event;

  const txId = `${event.block.block.header.number.toNumber()}-${event.idx}`;
  const token = (JSON.parse(tokenCodec.toString()) as { token?: string }).token;
  const amount = BigInt(amountCodec.toString());

  // this guards against crashing subql
  if (!token) return;

  const transfer = new TokenTransfer(txId);
  const fromAccount = await getAccount(fromCodec.toString());
  const toAccount = await getAccount(toCodec.toString());

  transfer.token = token;
  transfer.fromId = fromAccount.id;
  transfer.toId = toAccount.id;
  transfer.amount = amount;
  await transfer.save();

  // KAR/ACA stats as per task (ACA because I can only connect to Mandala)
  if (token !== "ACA") return;

  // update stats on receiving account
  const recvStats = bigintStats(
    (await TokenTransfer.getByToId(toAccount.id))
      .filter((tx: TokenTransfer) => tx.token === "ACA")
      .map((tx: TokenTransfer) => tx.amount)
  );
  toAccount.recvKarMean = recvStats.mean;
  toAccount.recvKarTotal = recvStats.total;
  toAccount.recvKarMedian = recvStats.median;

  // update stats on sending account
  const sentStats = bigintStats(
    (await TokenTransfer.getByFromId(fromAccount.id))
      .filter((tx: TokenTransfer) => tx.token === "ACA")
      .map((tx: TokenTransfer) => tx.amount)
  );
  fromAccount.sentKarMean = sentStats.mean;
  fromAccount.sentKarTotal = sentStats.total;
  fromAccount.sentKarMedian = sentStats.median;

  await toAccount.save();
  await fromAccount.save();
}

interface BigIntStats {
  mean: bigint;
  total: bigint;
  median: bigint;
}

function bigintStats(xs: Array<bigint>): BigIntStats {
  if (xs.length === 0) {
    return { mean: BigInt(0), total: BigInt(0), median: BigInt(0) };
  }
  const total = xs.reduce((acc, x) => acc + x);
  const mean = total / BigInt(xs.length);
  const median = xs.sort()[Math.floor(xs.length / 2)];
  return { mean, total, median };
}

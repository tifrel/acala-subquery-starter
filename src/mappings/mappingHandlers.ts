import { SubstrateEvent } from "@subql/types";
import { Codec } from "@polkadot/types/types";
import { DexSwap, DexDay } from "../types";

async function getDexDay(
  timestamp: string,
  supply: string,
  target: string,
  price: bigint
): Promise<DexDay> {
  const id = `${timestamp}-${supply}-${target}`;
  let record = await DexDay.get(id);
  if (!record) {
    record = new DexDay(id);
    record.timestamp = new Date(Date.parse(timestamp));
    record.supplyToken = supply;
    record.targetToken = target;

    // This is being handled automagically when using reverse lookups, otherwise
    // it requires manual massaging
    // record.swapsId = [];

    record.open = price;
    record.high = price;
    record.low = price;
    record.close = price;
    record.supplyVolume = BigInt(0);
    record.targetVolume = BigInt(0);

    await record.save();
  }
  return record;
}

/// Right now, the indexing is directional, which means that for each day on the
/// dex, prices are recorded seperately for e.g. XBTC/AUSD and AUSD/XBTC trading
/// pairs.
function decodeTokenPath(encoded: Codec): {
  supplyToken: string;
  targetToken: string;
  tokenPath: Array<string>;
} {
  const tokenPath = (encoded.toJSON() as Array<{ token: string }>).map(
    (o: { token: string }) => o.token
  );
  let supplyToken = tokenPath[0];
  let targetToken = tokenPath[tokenPath.length - 1];
  // [supplyToken, targetToken] = [supplyToken, targetToken].sort();
  return { tokenPath, supplyToken, targetToken };
}

export async function handleDexSwapEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [trader, tokenPath_, supplyAmount_, targetAmount_],
    },
  } = event;
  const { supplyToken, targetToken, tokenPath } = decodeTokenPath(tokenPath_);
  const supplyAmount = BigInt(supplyAmount_.toString());
  const targetAmount = BigInt(targetAmount_.toString());

  // This line determines the timeframe, so we can could construct hourly
  // indexing by slicing further.
  const today = event.block.timestamp.toISOString().slice(0, 10);
  // A single bigint will lead to big truncation errors in ratios, however subql
  // seems to dislike floats. Consequence: We express price as a bigint, where
  // 1 TARGET = (price / 1e12) SUPPLY
  const price = (targetAmount * BigInt(1e12)) / supplyAmount;
  const dexDay = await getDexDay(today, supplyToken, targetToken, price);

  const dexSwap = new DexSwap(`${event.block.hash}-${event.idx}`);
  dexSwap.trader = trader.toString();
  dexSwap.tokenPath = tokenPath;
  dexSwap.supplyAmount = supplyAmount;
  dexSwap.targetAmount = targetAmount;
  dexSwap.timestamp = event.block.timestamp;
  dexSwap.dexDayId = dexDay.id;
  await dexSwap.save();

  // dexDay.swapsId.push(dexSwap.id);
  dexDay.close = price;
  dexDay.high = price > dexDay.high ? price : dexDay.high;
  dexDay.low = price < dexDay.low ? price : dexDay.low;
  dexDay.supplyVolume += supplyAmount;
  dexDay.targetVolume += targetAmount;
  await dexDay.save();
}

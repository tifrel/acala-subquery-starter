import fetch from "node-fetch";

const apiEndpoint = "https://localhost:3000";

const sq = async (query) => {
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({ query }),
  });
  return response.json();
};

// ---- xxxx ---- //

const receivedTransfers = async (acc) => {
  const accFilter = `toId: {equalTo: "${acc}"}`;
  const karFilter = `tokenId: {equalTo: "KAR"}`;
  // FIXME: orderBy: AMOUNT_ASC seems to be broken
  const res = await sq(`query {
        transfers(filter: {${accFilter}, ${karFilter}}, orderBy: AMOUNT_DESC) {
            nodes { amount }
        }
      }`);
  // I guess these values are not KAR, but e.g. pico-KAR -> clarify
  return res.data.transfers.nodes.map((n) => BigInt(n.amount));
};

const sentTransfers = async (acc) => {
  const accFilter = `fromId: {equalTo: "${acc}"}`;
  const karFilter = `tokenId: {equalTo: "KAR"}`;
  const res = await sq(`query {
        transfers(filter: {${accFilter}, ${karFilter}}, orderBy: AMOUNT_DESC) {
            nodes { amount }
        }
      }`);
  // I guess these values are not KAR, but e.g. pico-KAR -> clarify
  return res.data.transfers.nodes.map((n) => BigInt(n.amount));
};

const numberStats = (xs) => {
  const total = Number(xs.reduce((acc, x) => acc + x));
  const median = Number(xs[Math.floor(xs.length / 2)]);
  const average = total / xs.length;
  return { total, median, average };
};

(async () => {
  // Index total/average/median KAR amounts for transfers that an account has
  // sent/received
  const addr = "pqfCiY9HfX3cWxRximv64jVu4BUbg8bTgQLyFKAKQw2zWCd";
  const received = await receivedTransfers(addr);
  console.log(`Received KAR for ${addr}:`, numberStats(received));
  const sent = await sentTransfers(addr);
  console.log(`Sent KAR from ${addr}:`, numberStats(sent));

  // Index daily volume/highs/lows for each trading pair on the DEX

  // For each liquidity pool, what account has contributed most liquidity?

  // Custom UI for interacting with Karura DEX

  // Portfolio page for karura including KAR, KSM, and LP token balances.
  // Include approximate price for each token

  // Webpage to show users kUSD loan with a visual indicator for danger of
  // getting liquidated
})();

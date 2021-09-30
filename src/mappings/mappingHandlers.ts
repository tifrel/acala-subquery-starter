import { SubstrateEvent } from "@subql/types";
import { Account, TokenTransfer } from "../types";
// import { Balance } from "@polkadot/types/interfaces";

async function getAccount(address: string): Promise<Account> {
  let account = await Account.get(address);
  if (!account) {
    account = new Account(address);
    account.publicAddress = address;
    account.sentTransfersId = [];
    account.recvTransfersId = [];
  }
  return account;
}

export async function handleCurrencyTransferEvent(
  event: SubstrateEvent
): Promise<void> {
  const {
    event: {
      data: [token, from, to, amount],
    },
  } = event;
  //Retrieve the record by its ID
  const txId = `${event.block.block.header.number.toNumber()}-${event.idx}`;
  const transfer = new TokenTransfer(txId);
  transfer.token = token.toString();
  transfer.from = from.toString();
  transfer.to = to.toString();
  transfer.amount = BigInt(amount.toString());
  await transfer.save();

  const fromAccount = await getAccount(from.toString());
  const toAccount = await getAccount(to.toString());

  fromAccount.sentTransfersId.push(txId);
  toAccount.recvTransfersId.push(txId);

  await fromAccount.save();
  await toAccount.save();
}

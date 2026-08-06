import { BigInt } from "@graphprotocol/graph-ts";
import {
  MerchantRegistered,
  MerchantRemoved,
  RewardMinted,
  RewardRedeemed,
  Transfer,
} from "../generated/MichiPoints/MichiPoints";
import { Merchant, Customer, RewardEvent } from "../generated/schema";

function loadOrCreateMerchant(id: string): Merchant {
  let merchant = Merchant.load(id);
  if (merchant === null) {
    merchant = new Merchant(id);
    merchant.isActive = false;
    merchant.totalMinted = BigInt.fromI32(0);
    merchant.registeredAt = BigInt.fromI32(0);
  }
  return merchant;
}

function loadOrCreateCustomer(id: string): Customer {
  let customer = Customer.load(id);
  if (customer === null) {
    customer = new Customer(id);
    customer.balance = BigInt.fromI32(0);
    customer.totalEarned = BigInt.fromI32(0);
    customer.totalRedeemed = BigInt.fromI32(0);
  }
  return customer;
}

export function handleMerchantRegistered(event: MerchantRegistered): void {
  const id = event.params.merchant.toHexString();
  const merchant = loadOrCreateMerchant(id);
  merchant.address = event.params.merchant;
  merchant.isActive = true;
  merchant.registeredAt = event.block.timestamp;
  merchant.save();
}

export function handleMerchantRemoved(event: MerchantRemoved): void {
  const id = event.params.merchant.toHexString();
  const merchant = Merchant.load(id);
  if (merchant === null) return;
  merchant.isActive = false;
  merchant.save();
}

export function handleRewardMinted(event: RewardMinted): void {
  const merchantId = event.params.merchant.toHexString();
  const merchant = loadOrCreateMerchant(merchantId);
  merchant.address = event.params.merchant;
  merchant.totalMinted = merchant.totalMinted.plus(event.params.reward);
  merchant.save();

  const customerId = event.params.customer.toHexString();
  const customer = loadOrCreateCustomer(customerId);
  customer.address = event.params.customer;
  customer.balance = customer.balance.plus(event.params.reward);
  customer.totalEarned = customer.totalEarned.plus(event.params.reward);
  customer.save();

  const rewardEvent = new RewardEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  rewardEvent.type = "MINT";
  rewardEvent.merchant = merchantId;
  rewardEvent.customer = customerId;
  rewardEvent.purchaseAmount = event.params.purchaseAmount;
  rewardEvent.amount = event.params.reward;
  rewardEvent.timestamp = event.block.timestamp;
  rewardEvent.transactionHash = event.transaction.hash.toHex();
  rewardEvent.save();
}

export function handleRewardRedeemed(event: RewardRedeemed): void {
  const merchantId = event.params.merchant.toHexString();
  const customerId = event.params.customer.toHexString();

  const customer = loadOrCreateCustomer(customerId);
  customer.address = event.params.customer;
  customer.balance = customer.balance.minus(event.params.amount);
  customer.totalRedeemed = customer.totalRedeemed.plus(event.params.amount);
  customer.save();

  const rewardEvent = new RewardEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  rewardEvent.type = "REDEEM";
  rewardEvent.merchant = merchantId;
  rewardEvent.customer = customerId;
  rewardEvent.amount = event.params.amount;
  rewardEvent.timestamp = event.block.timestamp;
  rewardEvent.transactionHash = event.transaction.hash.toHex();
  rewardEvent.save();
}

export function handleTransfer(event: Transfer): void {
  const fromId = event.params.from.toHexString();
  const fromAccount = loadOrCreateCustomer(fromId);
  fromAccount.address = event.params.from;
  fromAccount.balance = fromAccount.balance.minus(event.params.value);
  fromAccount.save();

  const toId = event.params.to.toHexString();
  const toAccount = loadOrCreateCustomer(toId);
  toAccount.address = event.params.to;
  toAccount.balance = toAccount.balance.plus(event.params.value);
  toAccount.save();

  const rewardEvent = new RewardEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  rewardEvent.type = "TRANSFER";
  rewardEvent.from = event.params.from;
  rewardEvent.to = event.params.to;
  rewardEvent.amount = event.params.value;
  rewardEvent.timestamp = event.block.timestamp;
  rewardEvent.transactionHash = event.transaction.hash.toHex();
  rewardEvent.save();
}

import {
  Account,
  Address,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  xdr,
} from '@stellar/stellar-sdk';
import type { RouterInvocation, RouterLeg } from './contracts.js';

export interface SwapTxInput {
  invocation: RouterInvocation;
  /** User's public key (G...). Never a secret — signing happens in the wallet. */
  userPublicKey: string;
  networkPassphrase: string;
  /**
   * Source account sequence as a decimal string. The wallet flow fetches the
   * live sequence from Horizon; `'0'` builds an offline preview that parses
   * but must not be submitted.
   */
  sequence: string;
  baseFeeStroops?: number;
}

/** Stellar amounts use 7 decimals; router args carry i128 stroop integers. */
function decimalToI128(amount: string): xdr.ScVal {
  if (!/^\d+(\.\d+)?$/.test(amount)) {
    throw new Error(`Invalid amount "${amount}": expected a non-negative decimal.`);
  }
  const [whole = '0', frac = ''] = amount.split('.') as [string, string?];
  const paddedFrac = `${frac}0000000`.slice(0, 7);
  const scaled = BigInt(whole === '' ? '0' : whole) * 10_000_000n + BigInt(paddedFrac);
  return nativeToScVal(scaled, { type: 'i128' });
}

function symbol(name: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(name);
}

/**
 * v0 leg encoding (documents the stub contract ABI): a vec of maps with
 * string pool refs plus u32 share weights. Pool refs become contract
 * addresses when the on-chain router ships.
 */
function legsToScVal(legs: RouterLeg[]): xdr.ScVal {
  return xdr.ScVal.scvVec(
    legs.map((leg) =>
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({ key: symbol('pool'), val: xdr.ScVal.scvString(leg.poolContractId) }),
        new xdr.ScMapEntry({ key: symbol('input'), val: xdr.ScVal.scvString(leg.inputAsset) }),
        new xdr.ScMapEntry({ key: symbol('output'), val: xdr.ScVal.scvString(leg.outputAsset) }),
        new xdr.ScMapEntry({
          key: symbol('share_bps'),
          val: nativeToScVal(leg.shareBps, { type: 'u32' }),
        }),
      ]),
    ),
  );
}

/**
 * Builds an UNSIGNED swap transaction (base64 XDR) for the selected route
 * (PRD §15): StellarIQ constructs, the user signs in-wallet, Stellar
 * executes. Throws on invalid keys, amounts or contract ids.
 */
export function buildSwapTransactionXdr(input: SwapTxInput): string {
  const { invocation } = input;
  const user = Address.fromString(input.userPublicKey);
  const contract = new Contract(invocation.contractId);

  const operation = contract.call(
    invocation.method,
    user.toScVal(),
    decimalToI128(invocation.args.amountIn),
    decimalToI128(invocation.args.minAmountOut),
    legsToScVal(invocation.args.legs),
    nativeToScVal(invocation.args.deadline, { type: 'u64' }),
  );

  const source = new Account(input.userPublicKey, input.sequence);
  const transaction = new TransactionBuilder(source, {
    fee: String(input.baseFeeStroops ?? 100),
    networkPassphrase: input.networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  return transaction.toXDR();
}

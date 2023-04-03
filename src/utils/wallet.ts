import { parseUserKey, UserSigner } from '@multiversx/sdk-wallet';
import { Account } from '@multiversx/sdk-core';

import { getNetworkProvider } from './networkProvider';

export async function getSignerAndAccount(pem: any, environment: 'testnet' | 'mainnet' | 'devnet') {
  const userKey = parseUserKey(pem);
  const account = new Account(userKey.generatePublicKey().toAddress());

  const userAccountOnNetwork = await getNetworkProvider(environment).getAccount(account.address);
  account.update(userAccountOnNetwork);

  const signer = UserSigner.fromPem(pem);

  return { signer, account };
}

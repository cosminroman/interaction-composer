import { ApiNetworkProvider } from '@multiversx/sdk-network-providers';

export function getNetworkProvider(environment: 'testnet' | 'mainnet' | 'devnet') {
  const URLS = {
    testnet: 'https://testnet-api.multiversx.com',
    mainnet: 'https://api.multiversx.com',
    devnet: 'https://devnet-api.multiversx.com',
  };

  const url = URLS[environment] || URLS['devnet'];

  return new ApiNetworkProvider(url);
}

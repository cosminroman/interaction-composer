import { Address, U64Value } from '@multiversx/sdk-core/out';

import { InteractionComposer } from '../interaction.composer';
import * as abiContent from './test-data/lottery.abi.json';

describe('test composer', () => {
  let composer;

  beforeEach(() => {
    composer = new InteractionComposer(abiContent, 'erd1qqqqqqqqqqqqqpgqja3t5swqcyt3jmlapdndt3ms4843weu9j0wquefts8');
  });

  it('should interact and compose a query', async function () {
    const query = await composer.composeQuery({
      functionName: 'getTicketsPerAddress',
      args: {
        lottery: 5,
        address: 'erd13evkc4p4svaq752ahqd4ussr9zkjxwa9w25dmz35yuysxwxkyzvq0q2e67',
      },
    });

    expect(query.args[0].valueOf()).toEqual(
      new Address('erd13evkc4p4svaq752ahqd4ussr9zkjxwa9w25dmz35yuysxwxkyzvq0q2e67').valueOf()
    );
    expect(query.args[1].valueOf()).toEqual(new U64Value(5).valueOf());
  });

  it('should interact and compose a transaction', async function () {
    const transaction = await composer.composeTransaction({
      functionName: 'buy_tickets',
      args: {
        tickets: 1,
        _opt_ref: '7uh6qn',
      },
    });

    expect(transaction.getData().toString()).toEqual('buy_tickets@01@37756836716e');
  });
});

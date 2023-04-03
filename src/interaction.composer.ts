import {
  AbiRegistry,
  Address,
  SmartContract,
  NativeSerializer,
  SmartContractAbi,
  ResultsParser,
  TransactionWatcher,
} from '@multiversx/sdk-core';

import { getNetworkProvider, getSignerAndAccount } from './utils';

export class InteractionComposer {
  private readonly abiContent;
  private readonly contractAddress;
  private readonly environment: 'testnet' | 'mainnet' | 'devnet';
  private readonly parser;
  private readonly networkProvider;
  private abi;

  constructor(abiContent: any, contractAddress: string, environment?: 'testnet' | 'mainnet' | 'devnet') {
    this.abiContent = abiContent;
    this.contractAddress = contractAddress;
    this.environment = environment;
    this.parser = new ResultsParser();
    this.networkProvider = getNetworkProvider(environment);
  }

  async composeQuery(composeArgs: QueryArgsToCompose): Promise<any> {
    try {
      const contract = await this.getContract();

      const typedValues = this.sortAndSerializeArguments(contract, composeArgs.functionName, composeArgs.args);

      const interaction = contract.methodsExplicit[composeArgs.functionName]([...typedValues]);

      return interaction.check().buildQuery();
    } catch (error) {
      throw new Error(error);
    }
  }

  async runQuery(composeArgs: QueryArgsToCompose): Promise<any> {
    try {
      const contract = await this.getContract();

      const typedValues = this.sortAndSerializeArguments(contract, composeArgs.functionName, composeArgs.args);

      const interaction = contract.methodsExplicit[composeArgs.functionName]([...typedValues]);

      const query = interaction.check().buildQuery();

      const queryResponse = await this.networkProvider.queryContract(query);

      return this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    } catch (error) {
      throw new Error(error);
    }
  }

  async composeTransaction(composeArgs: TransactionArgsToCompose): Promise<any> {
    try {
      const contract = await this.getContract();

      const typedValues = this.sortAndSerializeArguments(contract, composeArgs.functionName, composeArgs.args);

      const network = await this.networkProvider.getNetworkConfig();

      const interaction = contract.methodsExplicit[composeArgs.functionName]([...typedValues])
        .withGasLimit(composeArgs.gasLimit || 20000000)
        .withChainID(network.ChainID);

      return interaction.check().buildTransaction();
    } catch (error) {
      throw new Error(error);
    }
  }

  async runTransaction(composeArgs: TransactionArgs): Promise<any> {
    try {
      const contract = await this.getContract();

      const typedValues = this.sortAndSerializeArguments(contract, composeArgs.functionName, composeArgs.args);

      const network = await this.networkProvider.getNetworkConfig();

      const interaction = contract.methodsExplicit[composeArgs.functionName]([...typedValues])
        .withGasLimit(composeArgs.gasLimit || 20000000)
        .withChainID(network.ChainID);

      const transaction = interaction.check().buildTransaction();

      const { signer, account } = await getSignerAndAccount(composeArgs.pem, this.environment);

      transaction.setNonce(account.nonce);

      const serialized = transaction.serializeForSigning(account.address);
      const signature = await signer.sign(serialized);
      transaction.applySignature(signature, account.address);

      await this.networkProvider.sendTransaction(transaction);

      const transactionWatcher = new TransactionWatcher(this.networkProvider);
      const transactionOnNetwork = await transactionWatcher.awaitCompleted(transaction);

      return this.parser.parseOutcome(transactionOnNetwork, interaction.getEndpoint());
    } catch (error) {
      throw new Error(error);
    }
  }

  private sortAndSerializeArguments(contract: SmartContract, functionName: string, args: Args) {
    try {
      const endpoint = contract.getEndpoint(functionName);

      const argsOrder = endpoint.input;

      const sortedArgs = this.sortArguments(args, argsOrder);

      return NativeSerializer.nativeToTypedValues(Object.values(sortedArgs), endpoint);
    } catch (error) {
      throw new Error(error);
    }
  }

  private sortArguments(args: Args, argOrder): Args {
    const sortedArgs: Args = {};

    for (const { name } of argOrder) {
      if (args.hasOwnProperty(name)) {
        sortedArgs[name] = args[name];
      }
    }

    return sortedArgs;
  }

  private async load(): Promise<SmartContractAbi> {
    try {
      const abiRegistry = AbiRegistry.create(this.abiContent);

      return new SmartContractAbi(abiRegistry, [this.contractAddress]);
    } catch (error) {
      throw new Error('Error when creating contract from abi');
    }
  }

  private async getContract(): Promise<SmartContract> {
    if (!this.abi) {
      this.abi = await this.load();
    }

    return new SmartContract({
      address: new Address(this.contractAddress),
      abi: this.abi,
    });
  }
}

export class QueryArgsToCompose {
  functionName: string;
  args: Args;
}

export class TransactionArgsToCompose {
  functionName: string;
  args: Args;
  gasLimit?: number;
}

export class TransactionArgs {
  functionName: string;
  args: Args;
  pem: any;
  gasLimit?: number;
}

interface Args {
  [key: string]: string | number;
}

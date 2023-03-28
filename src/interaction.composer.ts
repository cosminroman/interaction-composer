import { AbiRegistry, Address, SmartContract, NativeSerializer, SmartContractAbi } from '@multiversx/sdk-core';

export class InteractionComposer {
  private readonly abiContent: any;
  private readonly contractAddress: string;
  private abi: SmartContractAbi | undefined = undefined;

  constructor(abiContent: any, contractAddress: string) {
    this.abiContent = abiContent;
    this.contractAddress = contractAddress;
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

  async composeCall(composeArgs: CallArgsToCompose): Promise<any> {
    try {
      const contract = await this.getContract();

      const typedValues = this.sortAndSerializeArguments(contract, composeArgs.functionName, composeArgs.args);

      const interaction = contract.methodsExplicit[composeArgs.functionName]([...typedValues])
        .withGasLimit(20000000)
        .withChainID('D');

      return interaction.check().buildTransaction();
    } catch (error) {
      throw new Error(error);
    }
  }

  private sortAndSerializeArguments(
    contract: SmartContract,
    functionName: string,
    args: { [key: string]: string | number }
  ) {
    try {
      const endpoint = contract.getEndpoint(functionName);

      const argsOrder = endpoint.input;

      const sortedArgs = this.sortArguments(args, argsOrder);

      return NativeSerializer.nativeToTypedValues(Object.values(sortedArgs), endpoint);
    } catch (error) {
      throw new Error(error);
    }
  }

  private sortArguments(args: { [key: string]: string | number }, argOrder): { [key: string]: number | string } {
    const sortedArgs: { [key: string]: number | string } = {};

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

export class CallArgsToCompose {
  caller?: string;
  functionName: string;
  args: Args;
}

interface Args {
  [key: string]: string | number;
}

# Interaction composer for JavaScript

Contract interaction composer for JavaScript and TypeScript (written in TypeScript).

## Usage

```js
const composer = new InteractionComposer(
  abiContent,
  contractAddress,
);

const query = await composer.composeQuery({
  functionName: 'myFunction',
  args: {
    a: "foo", 
    b: "bar"
  },
});

// query is ready to be executed

__________________________________________

const call = await composer.composeCall({
  functionName: 'myFunction',
  args: {
    a: "foo",
    b: "bar"
  },
});

// transaction is (almost) ready to be broadcasted
// set nonce, sign transaction
```

### Building the library

In order to compile the library, run the following:

```
npm install
npm run build
```

### Running the tests

In order to run the tests **on NodeJS**, do as follows:

```
npm run test
```

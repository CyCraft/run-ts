# run-ts 🏃🏼

A very basic package that to run typescript directly via node. Built for Node v20 >=.

## Installation

```
npm i -D @cycraft/run-ts
```

## Usage

Ise the `--import` flag to import the register code before executing your TS file directly:

```json
"scripts": {
  "execute-my-script": "node --import @cycraft/run-ts ./src/index.ts",
}
```

## Notes

> Is it flexible?
> Is it generic?

🤷 There's probably more flexible and generic ways of doing this. This however works for us, covering our use cases.

> Does it do typechecking?

No. It builds each file using esbuild when it's first imported, so doesn't do any typechecking. Use tsc or some other method to do typechecking.

> Is it fast?

🤷 Each file is built when it's first imported, on the one hand, it's only building whats necessary, on the other hand, there's 0 optimisation happening.
Additionally this is providing some assistance in how node resolves certain files (if you're used to skipping file extensions or index) by checking the existence of any possible files, which could be pretty slow, although it does cache the result.

> Should you use it?

It's up to you. As mentioned above, it works for our use cases.

import * as linera from "@linera/client";

const COUNTER_APP_ID = import.meta.env.VITE_COUNTER_APP_ID;

let count = 0;
let counter;

async function run() {
  await linera.default();
  const faucet = await new linera.Faucet(import.meta.env.VITE_COUNTER_APP_URL);
  const wallet = await faucet.createWallet();
  const client = await new linera.Client(wallet);
  document.getElementById("chain-id").innerText = await faucet.claimChain(
    client
  );
  counter = await client.frontend().application(COUNTER_APP_ID);

  const response = await counter.query('{ "query": "query { value }" }');
  count = JSON.parse(response).data.value;
  console.log(count);
}

await run();

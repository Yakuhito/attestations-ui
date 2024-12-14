import { useAccount, useSignTypedData } from "wagmi";
import { OverviewResponse } from "../models";
import EthereumWalletButton from "./EthereumWalletButon";

export default function EVMAttestationCreationComponent({
  validatorIndex,
  response,
  refetch
} : {
  validatorIndex: number,
  response: OverviewResponse | null,
  refetch: () => void
}) {
  const account = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const currentChallenge = response !== null ? response.week_infos[0].challenge_info : null;

  if(response !== null && response.week_infos[0].attestations.find((a) => a.validator_index === validatorIndex && a.chain_type === 'evm')) {
    return (
      <p className="text-center text-green-500 pt-4">Attestation already submitted for this period - thank you!</p>
    );
  }

  return (
    <>
      <div className="flex py-4 items-center">
        <span className="text-md pr-2">Wallet:</span> <EthereumWalletButton expectedAddress={response !== null ? response.eth_addresses[validatorIndex] : ''} />
      </div>
      {(!account || !account.address) ? (
        <></>
      ) : (
        <button
          className="mt-2 px-4 py-2 w-full border-2 border-green-500 hover:bg-green-500 hover:text-black font-medium rounded-xl text-green-500"
          onClick={async () => {
            let sig = await signTypedDataAsync({
              domain: {
                name: "warp.green Validator Attestations",
                version: "1"
              },
              types: {
                AttestationMessage: [
                  {name: "challenge", type: "bytes32"},
                  {name: "validatorIndex", type: "uint8"}
                ]
              },
              primaryType: "AttestationMessage",
              message: {
                challenge: ('0x' + currentChallenge?.challenge) as `0x${string}`,
                validatorIndex: validatorIndex
              }
            })

            sig = `${validatorIndex}-` + sig.replace('0x', '');

            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}attestation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chain_type: 'evm',
                attestation: sig,
              }),
            });
            const respJSON = await resp.json();

            console.log({ respJSON });

            if(!respJSON.attestation_id) {
              alert(`Failed to submit attestation: ${JSON.stringify(respJSON)}`);
            } else {
              alert('Attestation accepted :)');
              refetch();
            }
          }}
        >Generate & submit attestation</button>
      )}
    </>
  );
}

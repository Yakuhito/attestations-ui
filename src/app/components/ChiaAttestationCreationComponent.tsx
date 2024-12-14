import { useState } from "react";
import { ChallengeResponse, OverviewResponse } from "../models";

export default function ChiaAttestationCreationComponent({
  response,
  validatorIndex,
  refetch
} : {
  response: OverviewResponse | null,
  validatorIndex: number,
  refetch: () => void
}) {
  const currentChallenge: ChallengeResponse | null = response !== null ? response.week_infos[0].challenge_info : null;

  const pubkey = response?.xch_pubkeys[validatorIndex] ?? "";
  const xchSignChallengeCommand = `python3 cli.py rekey sign-challenge --challenge ${currentChallenge?.challenge} --validator-index ${validatorIndex} --pubkey ${pubkey}`;

  const [attestation, setAttestation] = useState('');

  if(response !== null && response.week_infos[0].attestations.find((a) => a.validator_index === validatorIndex && a.chain_type === 'chia')) {
    return (
      <p className="text-center text-green-500 pt-4">Attestation already submitted for this period - thank you!</p>
    );
  }
  return (
    <>
      <p className="pt-2">Sign Command:</p>
      <div className="mx-4">
        <code className="break-all">{xchSignChallengeCommand}</code>
      </div>
      <button
        className="mt-2 px-4 py-2 w-full border-2 border-zinc-800 hover:bg-zinc-700 font-medium rounded-xl"
        onClick={() => {
          navigator.clipboard.writeText(xchSignChallengeCommand)
          alert('Copied to clipboard')
        }}
      >Copy Command to Clipboard</button>

      <input
        type="text"
        placeholder={`Attestation (${validatorIndex}-...)`}
        value={attestation}
        onChange={(e) => setAttestation(e.target.value)}
        className="mt-8 px-4 py-2 w-full border-2 border-zinc-800 rounded-xl bg-black focus:outline-none focus:shadow-none focus:border-zinc-700"
      />
      <button
        className="mt-2 px-4 py-2 w-full border-2 border-green-500 hover:bg-green-500 hover:text-black font-medium rounded-xl text-green-500"
        onClick={async () => {
          if(!attestation) {
            return;
          }

          let attestationToSubmit = attestation;

          if(!attestationToSubmit.startsWith(`${validatorIndex}-`)) {
            attestationToSubmit = `${validatorIndex}-${attestationToSubmit}`;
          }
        
          const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}attestation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chain_type: 'chia',
              attestation: attestationToSubmit,
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
      >Submit attestation</button>
    </>
  )
}

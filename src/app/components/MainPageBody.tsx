"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { defaultWagmiConfig } from "@web3modal/wagmi";
import { base, mainnet } from "viem/chains";
import { WagmiProvider } from "wagmi";
import Section from "./Section";
import { ChallengeResponse, OverviewResponse } from "../models";
import { AttestationGridComponent } from "./AttestationGridComponent";
import { useState } from "react";
import ValidatorIndexInput from "./ValidatorIndexInput";

const metadata = {
  name: 'warp.green Attestations',
  description: 'warp.green Attestations web app',
  url: 'https://attestations.warp.green',
  icons: ['https://attestations.warp.green/warp-green-icon.png'],
}

const chains = [mainnet, base] as const

export const config = defaultWagmiConfig({
  chains,
  projectId: '9c147cfe8197435ab6fdc893d09c10e2',
  metadata,
  ssr: true,
})

const queryClient = new QueryClient()

export default function MainPageBody() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ActualMainBody />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function ActualMainBody() {
  const [ validatorIndex, setValidatorIndexInt ] = useState(parseInt(window.localStorage.getItem('validatorIndex') ?? "0"));
  const setValidatorIndex = (validatorIndex: number) => {
    window.localStorage.setItem('validatorIndex', validatorIndex.toString());
    setValidatorIndexInt(validatorIndex);
  };

  const { data, refetch } = useQuery({
    queryKey: ['mainPage_attestations'],
    queryFn: async () => await fetch(`${process.env.NEXT_PUBLIC_API_URL}overview`).then((res) => res.json()),
    enabled: true,
    refetchInterval: 5 * 60 * 1000,
  });

  const response: OverviewResponse | null = data ?? null;
  const currentChallenge: ChallengeResponse | null = response !== null ? response.week_infos[0].challenge_info : null;

  const pubkey = response?.xch_pubkeys[validatorIndex] ?? "";
  const xchSignChallengeCommand = `python3 cli.py rekey sign-challenge --challenge ${currentChallenge?.challenge} --validator-index ${validatorIndex} --pubkey ${pubkey}`;

  const [attestation, setAttestation] = useState('');

  return <div className="mt-8 mb-16">
    <Section
      title={currentChallenge !== null ? `Current Challenge for Week ${currentChallenge.week}` : 'Current Challenge'}
    >
      <p className="text-md font-semibold mt-4">Challenge:</p>
      <p className="text-md text-center">{currentChallenge?.challenge ?? "Loading..."}</p>
      <p className="text-md font-semibold mt-4">Generated at:</p>
      <p className="text-md text-center">{currentChallenge?.created_at ? new Date(parseInt(currentChallenge?.created_at ?? 0) * 1000).toUTCString() : "Loading..."}</p>
      <p className="text-md font-semibold mt-2">Time Proof:</p>
      <p className="text-md text-center break-words">{currentChallenge?.time_proof ?? "Loading..."}</p>
    </Section>
    <Section title="XCH Attestations Overview">
      <AttestationGridComponent data={response} for_chain="chia"/>
    </Section>
    <Section title="Submit XCH Attestation">
      <ValidatorIndexInput validatorIndex={validatorIndex} setValidatorIndex={setValidatorIndex} />
      <p>Sign Command:</p>
      <div className="mx-4">
        <code className="break-all">{xchSignChallengeCommand}</code>
      </div>
      <button
        className="mt-2 px-4 py-2 w-full border-2 border-zinc-800 hover:bg-zinc-700 font-medium rounded-md"
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
        className="mt-8 px-4 py-2 w-full border-2 border-zinc-800 rounded-md bg-black focus:outline-none focus:shadow-none focus:border-zinc-700"
      />
      <button
        className="mt-2 px-4 py-2 w-full border-2 border-zinc-800 hover:bg-zinc-700 font-medium rounded-md text-green-500"
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
    </Section>
    <Section title="EVM Attestations Overview">
      <AttestationGridComponent data={response} for_chain="evm"/>
    </Section>
    <Section title="Submit EVM Attestation">
      <ValidatorIndexInput validatorIndex={validatorIndex} setValidatorIndex={setValidatorIndex} />
      TODO
    </Section>
  </div>;
}

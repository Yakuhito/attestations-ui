"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { defaultWagmiConfig, Web3Modal } from "@web3modal/wagmi";
import { base, mainnet } from "viem/chains";
import { useAccount, useSignTypedData, WagmiProvider } from "wagmi";
import Section from "./Section";
import { ChallengeResponse, OverviewResponse } from "../models";
import { AttestationGridComponent } from "./AttestationGridComponent";
import { Suspense, useEffect, useState } from "react";
import ValidatorIndexInput from "./ValidatorIndexInput";
import { createWeb3Modal, useWalletInfo, useWeb3Modal } from "@web3modal/wagmi/react";

const metadata = {
  name: 'warp.green Attestations',
  description: 'warp.green Attestations web app',
  url: 'https://attestations.warp.green',
  icons: ['https://attestations.warp.green/warp-green-icon.png'],
}

const chains = [mainnet, base] as const

const WALLETCONNECT_PROJECT_ID = '9c147cfe8197435ab6fdc893d09c10e2';
export const config = defaultWagmiConfig({
  chains,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata,
  ssr: false
})

const queryClient = new QueryClient()


createWeb3Modal({
  wagmiConfig: config,
  projectId: WALLETCONNECT_PROJECT_ID,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'var(--font-inter)',
    '--w3m-border-radius-master': '2px',
    '--w3m-accent': '#8064dd',
    '--w3m-color-mix': '#000',
    '--w3m-color-mix-strength': 35,
  },
})

export default function MainPageBody() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Suspense>
          <ActualMainBody />
        </Suspense>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function ActualMainBody() {
  const [ validatorIndex, setValidatorIndexInt ] = useState(0);
  useEffect(() => {
    setValidatorIndexInt(parseInt(window.localStorage.getItem('validatorIndex') ?? "0"));
  }, []);

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
      {
        (response !== null && response.week_infos[0].attestations.find((a) => a.validator_index === validatorIndex && a.chain_type === 'chia')) ? (
          <p className="text-center text-green-500 pt-4">Attestation already submitted for this week - thank you!</p>
        ) : (
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
    </Section>
    <Section title="EVM Attestations Overview">
      <AttestationGridComponent data={response} for_chain="evm"/>
    </Section>
    <Section title="Submit EVM Attestation">
      <ValidatorIndexInput validatorIndex={validatorIndex} setValidatorIndex={setValidatorIndex} />
      {(response !== null && response.week_infos[0].attestations.find((a) => a.validator_index === validatorIndex && a.chain_type === 'evm')) ? (
          <p className="text-center text-green-500 pt-4">Attestation already submitted for this week - thank you!</p>
        ) : (
          <>
            <div className="flex py-4 items-center">
              <span className="text-md pr-2">Wallet:</span> <EthereumWalletButton expectedAddress={response !== null ? response.eth_addresses[validatorIndex] : ''} />
            </div>
            <EVMAttestationCreationComponent validatorIndex={validatorIndex} challenge={currentChallenge?.challenge ?? ''} refetch={refetch} />
          </>
        )}
    </Section>
  </div>;
}


function EthereumWalletButton({
  expectedAddress
} : {
  expectedAddress: string
}) {
  const { open } = useWeb3Modal()
  const { walletInfo } = useWalletInfo()
  const account = useAccount()
  const isConnected = Boolean(walletInfo?.name)

  return (
    <>
      <button onClick={() => open()} className={"px-2 py-2 border-2 border-zinc-800 rounded-xl text-base gap-2 flex" + (!isConnected ? 'shadow-sm shadow-white/80' : '')}>
        {isConnected ? !!account.address ? `${account.address}` : 'Manage Wallet' : 'Connect ETH Wallet'}
      </button>
      {isConnected && expectedAddress !== account.address && <p className="pl-4 text-red-500">Wrong address</p>}
    </>
  )
}

function EVMAttestationCreationComponent({
  validatorIndex,
  challenge,
  refetch
} : {
  validatorIndex: number,
  challenge: string,
  refetch: () => void
}) {
  const account = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  if(!account || !account.address) {
    return (<></>);
  }

  return (
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
            challenge: ('0x' + challenge) as `0x${string}`,
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
  );
}

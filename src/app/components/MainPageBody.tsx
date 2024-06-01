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
import EthereumWalletButton from "./EthereumWalletButon";
import EVMAttestationCreationComponent from "./EVMAttestationCreationComponent";
import ChiaAttestationCreationComponent from "./ChiaAttestationCreationComponent";

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
      <ChiaAttestationCreationComponent response={response} validatorIndex={validatorIndex} refetch={refetch} />
    </Section>
    <Section title="EVM Attestations Overview">
      <AttestationGridComponent data={response} for_chain="evm"/>
    </Section>
    <Section title="Submit EVM Attestation">
      <ValidatorIndexInput validatorIndex={validatorIndex} setValidatorIndex={setValidatorIndex} />
      <EVMAttestationCreationComponent validatorIndex={validatorIndex} response={response} refetch={refetch} />
    </Section>
  </div>;
}

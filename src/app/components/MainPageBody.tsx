"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { defaultWagmiConfig } from "@web3modal/wagmi";
import { base, mainnet } from "viem/chains";
import { WagmiProvider } from "wagmi";
import Section from "./Section";
import { ChallengeResponse, OverviewResponse } from "../models";
import { AttestationGridComponent } from "./AttestationGridComponent";

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
      TODO
    </Section>
    <Section title="EVM Attestations Overview">
      <AttestationGridComponent data={response} for_chain="evm"/>
    </Section>
    <Section title="Submit EVM Attestation">
      TODO
    </Section>
  </div>;
}

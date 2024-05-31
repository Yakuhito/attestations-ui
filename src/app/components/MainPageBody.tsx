"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { defaultWagmiConfig } from "@web3modal/wagmi";
import { base, mainnet } from "viem/chains";
import { WagmiProvider } from "wagmi";

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

type ChallengeResponse = {
  week: number;
  challenge: string;
  time_proof: string;
  created_at: string;
};

type AttestationResponse = {
  attestation_id: string;
  validator_index: number;
  chain_type: string;
  signature: string;
  week: number;
  created_at: string;
};

type WeekInfo = {
  week_name: string;
  challenge_info: ChallengeResponse | null;
  attestations: AttestationResponse[];
};

type OverviewResponse = {
  week_infos: WeekInfo[];
};

function ActualMainBody() {
  const { data } = useQuery({
    queryKey: ['mainPage_attestations'],
    queryFn: async () => await fetch(`${process.env.NEXT_PUBLIC_API_URL}overview`).then((res) => res.json()),
    enabled: true,
    refetchInterval: 5 * 60 * 1000,
  });

  const response: OverviewResponse | null = data ?? null;

  console.log({ response })

  return <div>
    TODO
  </div>;
}

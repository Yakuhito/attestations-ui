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
  const currentChallenge: ChallengeResponse | null = response !== null ? response.week_infos[0].challenge_info : null;

  return <div className="mt-8">
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
    <Section title="EVM Attestations Overview">
      <AttestationGridComponent data={response} for_chain="evm"/>
    </Section>
  </div>;
}

function Section({
  title,
  children
} : {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border-2 border-zinc-800 px-6 py-4 mt-4">
      <p className="text-2xl font-semibold mb-4">{title}</p>
      {children}
    </div>
  )
}

function AttestationGridComponent ({
    data,
    for_chain,
} : {
  data: OverviewResponse | null,
  for_chain: string,
}) {
  const weekInfos = data ? data.week_infos.slice().reverse() : [];
  const weekNames = weekInfos.map((weekInfo) => weekInfo.week_name);

  return (
    <div className="overflow-x-auto text-xs">
      <table className="min-w-full max-w-full bg-black border border-zinc-800 table-auto">
        <thead>
          <tr>
            <th className="px-2 py-2 border border-zinc-800 w-1/12"></th>
            {weekNames.length > 0
              ? weekNames.map((weekName, index) => (
                  <th key={index} className="px-2 py-2 border border-zinc-800 w-1/12">
                    {weekName}
                  </th>
                ))
              : Array.from({ length: 7 }, (_, index) => (
                  <th key={index} className="px-2 py-2 border border-zinc-800 w-1/12">
                    Loading...
                  </th>
                ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 11 }, (_, validatorIndex) => (
            <tr key={validatorIndex}>
              <td className="px-2 py-2 border border-zinc-800 whitespace-nowrap">Validator #{validatorIndex}</td>
              {weekNames.length > 0
                ? weekInfos.map((weekInfo, weekIndex) => {
                    const isLatestWeek =
                      weekIndex === weekInfos.length - 1;
                    const attestation = weekInfo.attestations.find(
                      (att) => att.validator_index === validatorIndex && att.chain_type === for_chain
                    );

                    const getBgColor = (attestation: AttestationResponse | undefined) => {
                      if (weekInfo.challenge_info === null) {
                        return "bg-gray-500";
                      }
                      
                      if (!attestation) {
                        return isLatestWeek ? "bg-orange-500" : "bg-red-500";
                      }

                      return "bg-green-500";
                    }

                    return (
                      <td
                        key={`${weekIndex}-${validatorIndex}`}
                        className={`px-2 py-2 border border-l-2 border-zinc-800 ${getBgColor(attestation)}`}
                      ></td>
                    );
                  })
                : Array.from({ length: 7 }, (_, index) => (
                    <td
                      key={index}
                      className="px-2 py-2 border border-zinc-800 bg-transparent"
                    ></td>
                  ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

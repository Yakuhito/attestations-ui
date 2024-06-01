import { AttestationResponse, OverviewResponse } from "../models";

export function AttestationGridComponent ({
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

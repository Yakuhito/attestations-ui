export type ChallengeResponse = {
  week: number;
  challenge: string;
  time_proof: string;
  created_at: string;
};

export type AttestationResponse = {
  attestation_id: string;
  validator_index: number;
  chain_type: string;
  signature: string;
  week: number;
  created_at: string;
};

export type WeekInfo = {
  week_name: string;
  challenge_info: ChallengeResponse | null;
  attestations: AttestationResponse[];
};

export type OverviewResponse = {
  week_infos: WeekInfo[];
};

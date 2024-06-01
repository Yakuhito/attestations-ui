import { useState } from "react";
import { OverviewResponse } from "../models"
import { verifyTypedData } from "viem";

export default function AttestationVerificationComponent({
  response
} : {
  response: OverviewResponse | null
}) {
  const [buttonText, setButtonText] = useState<string>('Verify Attestations');
  const [verifying, setVerifying] = useState<boolean>(false);

  if(response === null) {
    return <></>;
  }

  const verifyAttestations = async () => {
    let alerted = false;

    setButtonText('Verifying ETH attestations...');

    const ethAddresses = response.eth_addresses;
    
    for(let weekIndex = 0; weekIndex < response.week_infos.length; ++weekIndex) {
      const weekInfo = response.week_infos[weekIndex];
      const challenge = '0x' + weekInfo.challenge_info?.challenge;

      if(!challenge) {
        continue;
      }

      setButtonText(`Verifying ETH attestations for ${weekInfo.week_name}...`);
      for(let attestationIndex = 0 ; attestationIndex < weekInfo.attestations.length; ++attestationIndex) {
        const attestation = weekInfo.attestations[attestationIndex];
        const signature = '0x' + attestation.signature;

        if(attestation.chain_type !== 'evm') {
          continue;
        }

        const validatorIndex = attestation.validator_index;
        const expectedAddress = ethAddresses[validatorIndex];

        const result = await verifyTypedData({
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
            challenge: challenge as `0x${string}`,
            validatorIndex: validatorIndex
          },
          address: expectedAddress as `0x${string}`,
          signature: signature as `0x${string}`,
        })

        if(!result) {
          alert(`Attestation for week ${weekInfo.week_name} and validator index ${validatorIndex} is invalid`);
          alerted = true;
        }
      }
    }

    return !alerted;
  };

  return <button
    className={
      "mt-4 px-4 py-2 w-full border-2 border-green-500 font-medium rounded-xl text-green-500 " + (verifying ? 'opacity-50' : 'hover:bg-green-500 hover:text-black')
    }
    onClick={async () => {
      setVerifying(true);
      try {
        const res = await verifyAttestations();
        if(res) {
          alert('All attestations have been verified successfully!');
        } else {
          alert('Some attestations failed verification - the ones you have not been notified about are ok.');
        }
      } catch(e) {
        console.error(e);
        alert('Error verifying attestations - see console for details');
      } finally {
        setVerifying(false);
        setButtonText('Verify Attestations');
      }
    }}
    disabled={verifying}
  >{buttonText}</button>
}

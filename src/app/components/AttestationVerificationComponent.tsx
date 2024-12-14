import { useState } from "react";
import { OverviewResponse } from "../models"
import { verifyTypedData } from "viem";
import { initializeBLS, SExp, getBLSModule } from "clvm";
import * as GreenWeb from 'greenwebjs';

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
          alert(`EVM attestation for period ${weekInfo.week_name} and validator index ${validatorIndex} is invalid`);
          alerted = true;
        }
      }
    }

    setButtonText('Initializing BLS...');
    try {
      await initializeBLS();
    } catch(e) {
      alert('Error initializing BLS - refreshing the page so it works next time you click the button. Chia attestations not yet verified.');
      location.reload();
      return false;
    }

    const pubkeys = response.xch_pubkeys;
    for(let weekIndex = 0; weekIndex < response.week_infos.length; ++weekIndex) {
      const weekInfo = response.week_infos[weekIndex];
      const challenge = weekInfo.challenge_info?.challenge;

      if(!challenge) {
        continue;
      }

      setButtonText(`Verifying Chia attestations for ${weekInfo.week_name}...`);
      for(let attestationIndex = 0 ; attestationIndex < weekInfo.attestations.length; ++attestationIndex) {
        const attestation = weekInfo.attestations[attestationIndex];
        const signature = attestation.signature;

        if(attestation.chain_type === 'evm') {
          continue;
        }

        const validatorIndex = attestation.validator_index;

        const message = `Validator #${validatorIndex} attests having access to their cold private XCH key by signing this message with the following challenge: ${challenge}`
        console.log({ message })
        const messageHash = Buffer.from(
            GreenWeb.util.sexp.sha256tree(
              SExp.to(message)
            ),
            'hex'
        );
        console.log({ messageHash: GreenWeb.util.sexp.sha256tree(
              SExp.to(message)
            ) })

        const { AugSchemeMPL, G1Element, G2Element } = getBLSModule();

        const pubkey = G1Element.from_bytes(Buffer.from(pubkeys[validatorIndex], 'hex'));
        const sig = G2Element.from_bytes(Buffer.from(signature, 'hex'));

        const result = AugSchemeMPL.verify(pubkey, messageHash, sig);

        if(!result) {
          alert(`Chia attestation for period ${weekInfo.week_name} and validator index ${validatorIndex} is invalid`);
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

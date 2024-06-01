import { useWalletInfo, useWeb3Modal } from "@web3modal/wagmi/react"
import { useAccount } from "wagmi"

export default function EthereumWalletButton({
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

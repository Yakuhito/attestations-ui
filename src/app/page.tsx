import Image from "next/image";
import dynamic from 'next/dynamic'

const MainPageBody = dynamic(() => import('./components/MainPageBody'), { ssr: false })


export default function Home() {
  return (
    <main className="flex flex-col min-h-screen w-full bg-black text-zinc-300">
      <div className="min-w-3xl max-w-3xl w-3xl mx-auto px-4">
        <div className="pt-8 flex justify-center items-center">
          <Image
            src='/warp-green-logo.png'
            alt='warp.green logo'
            className="h-5 aspect-auto w-auto"
            width={837}
            height={281}
            priority
          />
          <p className="text-2xl pl-2">| Automated Attestation Verification Service</p>
        </div>
        <MainPageBody />
      </div>
    </main>
  );
}

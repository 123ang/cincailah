import Image from 'next/image';
import Link from 'next/link';

interface AuthBrandHeaderProps {
  subtitle: string;
}

export default function AuthBrandHeader({ subtitle }: AuthBrandHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <Link href="/" className="inline-flex flex-col items-center gap-3">
        <Image
          src="/brand/cincailah-logo.jpeg"
          alt=""
          width={80}
          height={80}
          className="brand-logo h-20 w-20 rounded-[1.4rem] object-cover shadow-xl shadow-sambal/20"
          priority
        />
        <div>
          <h1 className="text-3xl font-black leading-none tracking-tight text-slate dark:text-white">cincailah</h1>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-sambal dark:text-orange-300">
            makan roulette
          </p>
        </div>
      </Link>
      <p className="mt-3 text-sm font-semibold text-slate/55 dark:text-gray-300">{subtitle}</p>
    </div>
  );
}

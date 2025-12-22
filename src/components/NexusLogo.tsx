import Image from "next/image";

export default function NexusLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <Image
      src="/favicon-32x32.png"
      alt="NEXUS Logo"
      width={24}
      height={24}
      className={className}
      unoptimized
    />
  );
}


import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/groweasy-logo.png"
        alt="GrowEasy"
        width={32}
        height={32}
        className="rounded-lg"
      />
      <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
        GrowEasy
      </span>
    </div>
  );
}
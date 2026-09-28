import Image from "next/image";

/**
 * CardO brand mark — uses the official app icon (cardcue.png).
 */
export function CardCueMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/icon-192.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={`rounded-[22%] object-cover ${className}`}
      priority
    />
  );
}

export function CardCueLogo({
  size = 32,
  wordClassName = "text-ink",
}: {
  size?: number;
  wordClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <CardCueMark size={size} />
      <span
        className={`text-[17px] font-semibold tracking-tight ${wordClassName}`}
      >
        CardO
      </span>
    </span>
  );
}

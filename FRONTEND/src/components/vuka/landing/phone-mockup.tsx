import phoneImage from "@/assets/vuka-phone.png";

/** Illustrative device preview image — not a screenshot of the live product. */
export function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <img
      src={phoneImage}
      alt="Illustrative preview of the VUKA mobile payment dashboard on a smartphone"
      className={`block h-auto w-[280px] max-w-full ${className}`}
    />
  );
}

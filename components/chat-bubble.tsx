import { ChatMessage } from "@/lib/types";
import { TUTOR_NAME } from "@/lib/brand";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isTutor = message.role === "tutor";

  return (
    <div className={`flex ${isTutor ? "justify-start" : "justify-end"}`}>
      <div
        className={[
          "max-w-[88%] rounded-[24px] border px-4 py-4 shadow-bubble md:max-w-[76%]",
          isTutor ? "rounded-tl-md border-leaf/10 bg-white" : "rounded-tr-md border-leaf/20 bg-mint",
        ].join(" ")}
      >
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
          {isTutor ? TUTOR_NAME : "You"}
        </span>
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-ink">{message.text}</p>
      </div>
    </div>
  );
}

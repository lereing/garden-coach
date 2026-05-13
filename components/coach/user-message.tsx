type UserMessageProps = {
  content: string;
};

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-foreground/[0.06] px-4 py-3 text-base leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}

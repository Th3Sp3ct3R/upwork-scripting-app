export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}

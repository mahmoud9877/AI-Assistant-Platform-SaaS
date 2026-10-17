export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-eve">
      <div className="text-white text-xl animate-pulse">{label}</div>
    </div>
  );
}

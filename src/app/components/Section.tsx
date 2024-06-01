export default function Section({
  title,
  children
} : {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-zinc-800 px-6 py-4 mt-4">
      <p className="text-2xl font-semibold mb-4">{title}</p>
      {children}
    </div>
  )
}

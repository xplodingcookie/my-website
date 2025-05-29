import LinearProgramming from "./LinearProgramming";

export const metadata = {
  title: "Linear Programming Demo",
  description: "Interactive simplex‑method visualisation",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex items-start justify-center py-10">
      <LinearProgramming />
    </main>
  );
}
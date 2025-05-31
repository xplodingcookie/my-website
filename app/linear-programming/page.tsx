import LinearProgramming from "./LinearProgramming";

export const metadata = {
  title: "Linear Programming Demo",
  description: "Interactive simplex-method visualisation",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <LinearProgramming />
      </div>
    </main>
  );
}
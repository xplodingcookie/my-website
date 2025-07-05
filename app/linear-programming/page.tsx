import LinearProgramming from "./LinearProgramming";

export const metadata = {
  title: "Linear Programming Demo",
  description: "Interactive simplex-method visualisation",
};

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <LinearProgramming />
    </div>
  );
}
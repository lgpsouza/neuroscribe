import { Header } from "@/components/ui/header";
import { Recorder } from "@/components/ui/recorder";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        <Recorder />
      </main>
    </div>
  );
}

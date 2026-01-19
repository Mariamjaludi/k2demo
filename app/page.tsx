import { MobileAgentView } from "@/components/MobileAgentView";
import { TerminalLogs } from "@/components/TerminalLogs";
import { DemoControlBar } from "@/components/DemoControlBar";

export default function Home() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-900">
      {/* Demo Control Bar */}
      <DemoControlBar />

      {/* Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Mobile Agent View */}
        <div className="flex w-1/2 items-center justify-center border-r border-zinc-700 bg-zinc-800 p-8">
          <MobileAgentView />
        </div>

        {/* Right: Terminal Logs */}
        <div className="flex w-1/2 flex-col bg-zinc-950">
          <TerminalLogs />
        </div>
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Dashboard from "./pages/Dashboard";
import WeeklyBriefs from "./pages/WeeklyBriefs";
import VibecodeCore from "./pages/VibecodeCore";
import VibecodeStack from "./pages/VibecodeStack";
import VibecodeGlossary from "./pages/VibecodeGlossary";
import VibecodePrompting from "./pages/VibecodePrompting";
import VibecodeBoundaries from "./pages/VibecodeBoundaries";
import DecisionsInbox from "./pages/DecisionsInbox";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/weekly-briefs" element={<WeeklyBriefs />} />
        <Route path="/vibecode-core" element={<VibecodeCore />} />
        <Route path="/vibecode-core/stack" element={<VibecodeStack />} />
        <Route path="/vibecode-core/stack/:slug" element={<VibecodeStack />} />
        <Route path="/vibecode-core/glossary" element={<VibecodeGlossary />} />
        <Route path="/vibecode-core/prompting" element={<VibecodePrompting />} />
        <Route path="/vibecode-core/boundaries" element={<VibecodeBoundaries />} />
        <Route path="/decisions-inbox" element={<DecisionsInbox />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

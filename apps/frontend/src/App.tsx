import "./index.css";
import { LandingPage } from "./components/LandingPage";
import { WorkspaceApp } from "./components/WorkspaceApp";

function App() {
  return window.location.pathname === "/app" ? (
    <WorkspaceApp />
  ) : (
    <div className="page" data-platform="mac">
      <LandingPage />
    </div>
  );
}
export default App;

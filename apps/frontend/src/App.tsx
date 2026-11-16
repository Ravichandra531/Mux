import "./index.css";
import { LandingPage } from "./components/LandingPage";
import { AccountPage } from "./components/AccountPage";
import { AuthPage } from "./components/AuthPage";
import { WorkspaceApp } from "./components/WorkspaceApp";

function App() {
  return ["/login", "/signup"].includes(window.location.pathname) ? (
    <AuthPage />
  ) : window.location.pathname === "/app" ? (
    import.meta.env.PROD ? <AccountPage /> : <WorkspaceApp />
  ) : (
    <div className="page" data-platform="mac">
      <LandingPage />
    </div>
  );
}
export default App;

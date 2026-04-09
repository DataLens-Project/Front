import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { FloatingChatButton } from "./FloatingChatButton";
import { ThemeProvider } from "../context/ThemeContext";

export function RootLayout() {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <FloatingChatButton />
      </div>
    </ThemeProvider>
  );
}
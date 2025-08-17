import { Outlet } from "react-router";
import { Box } from "@mantine/core";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarWidth = 260;
  const headerHeight = 60;

  return (
    <Box style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Sidebar width={sidebarWidth} />

      {/* Main Content Area */}
      <Box style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Header height={headerHeight} />

        {/* Page Content */}
        <Box
          style={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "#f8f9fa",
            padding: "20px",
          }}>
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
}

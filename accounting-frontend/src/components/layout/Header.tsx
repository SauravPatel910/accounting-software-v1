// prettier-ignore
import { Group, Text, UnstyledButton, Menu, Avatar, ActionIcon, Badge, Tooltip, Box } from "@mantine/core";
// prettier-ignore
import { IconBell, IconSearch, IconSettings, IconLogout, IconUser, IconHelp, IconSun } from "@tabler/icons-react";
import { useAuth } from "../../hooks/useAuth";
import { notifications } from "@mantine/notifications";

interface HeaderProps {
  height?: number;
}

export function Header({ height = 60 }: HeaderProps) {
  const { user, signOut } = useAuth();

  // Mock notifications data - replace with actual data
  const mockNotifications = [
    { id: 1, title: "Invoice #001 overdue", type: "warning" },
    { id: 2, title: "New customer registered", type: "info" },
    { id: 3, title: "Bank reconciliation needed", type: "error" },
  ];

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      notifications.show({
        title: "Error",
        message: "Failed to sign out",
        color: "red",
      });
    }
  };

  // Use auth user data or fallback to mock data
  const userData = user
    ? {
        name:
          user.user_metadata?.first_name && user.user_metadata?.last_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
            : user.email || "User",
        email: user.email || "",
        company: user.user_metadata?.company_name || "Your Company",
      }
    : {
        name: "User",
        email: "",
        company: "Your Company",
      };

  return (
    <Box
      style={{
        height: height,
        padding: "0 16px",
        borderBottom: "1px solid #e0e0e0",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
      }}>
      <Group justify="space-between" h="100%">
        {/* Left side - Breadcrumb or Search */}
        <Group gap="md">
          <ActionIcon variant="subtle" size="lg">
            <IconSearch size={18} />
          </ActionIcon>
          <Text size="sm" c="dimmed">
            Dashboard / Overview
          </Text>
        </Group>

        {/* Right side - User controls */}
        <Group gap="md">
          {/* Notifications */}
          <Menu shadow="md" width={300} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" pos="relative">
                <IconBell size={18} />
                {mockNotifications.length > 0 && (
                  <Badge
                    size="xs"
                    variant="filled"
                    color="red"
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      minWidth: "18px",
                      height: "18px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    {mockNotifications.length}
                  </Badge>
                )}
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Notifications</Menu.Label>
              {mockNotifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  <Box>
                    <Text size="sm" fw={500}>
                      {notification.title}
                    </Text>
                    <Badge
                      size="xs"
                      color={
                        notification.type === "warning"
                          ? "yellow"
                          : notification.type === "error"
                          ? "red"
                          : "blue"
                      }
                      mt={4}>
                      {notification.type}
                    </Badge>
                  </Box>
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item>
                <Text size="sm" c="blue">
                  View all notifications
                </Text>
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Theme Toggle */}
          <Tooltip label="Toggle theme">
            <ActionIcon variant="subtle" size="lg">
              <IconSun size={18} />
            </ActionIcon>
          </Tooltip>

          {/* Help */}
          <Tooltip label="Help & Support">
            <ActionIcon variant="subtle" size="lg">
              <IconHelp size={18} />
            </ActionIcon>
          </Tooltip>

          {/* User Menu */}
          <Menu shadow="md" width={250} position="bottom-end">
            <Menu.Target>
              <UnstyledButton
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid transparent",
                  transition: "border-color 150ms ease",
                }}>
                <Group gap="sm">
                  <Avatar size={32} radius="xl" color="blue">
                    {userData.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </Avatar>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {userData.name}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {userData.company}
                    </Text>
                  </Box>
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>

              <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>

              <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>

              <Menu.Divider />

              <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}

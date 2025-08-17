import { Box, Text, Card, SimpleGrid, Button, Group } from "@mantine/core";
import { IconSettings, IconUser, IconBuildingBank, IconShield } from "@tabler/icons-react";

export function Settings() {
  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>
            Settings
          </Text>
          <Text size="sm" c="dimmed">
            Configure your application preferences and business settings
          </Text>
        </Box>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg">
        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconUser size={20} color="var(--mantine-color-blue-6)" />
            <Text size="lg" fw={600}>
              Profile
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Manage your personal information and preferences
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconBuildingBank size={20} color="var(--mantine-color-green-6)" />
            <Text size="lg" fw={600}>
              Company
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Update company details and business information
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconShield size={20} color="var(--mantine-color-orange-6)" />
            <Text size="lg" fw={600}>
              Security
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Password, two-factor auth, and security settings
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconSettings size={20} color="var(--mantine-color-grape-6)" />
            <Text size="lg" fw={600}>
              Preferences
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Customize display, notifications, and defaults
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>
      </SimpleGrid>
    </Box>
  );
}

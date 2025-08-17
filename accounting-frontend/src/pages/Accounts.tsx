import { Box, Text, Card, SimpleGrid, Button, Group } from "@mantine/core";
import { IconCalculator, IconPlus, IconList } from "@tabler/icons-react";

export function Accounts() {
  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>
            Chart of Accounts
          </Text>
          <Text size="sm" c="dimmed">
            Manage your accounting structure and account categories
          </Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />}>Add Account</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconList size={20} color="var(--mantine-color-blue-6)" />
            <Text size="lg" fw={600}>
              All Accounts
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            View and manage your complete chart of accounts
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconPlus size={20} color="var(--mantine-color-green-6)" />
            <Text size="lg" fw={600}>
              Add Account
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Create new accounts for your business structure
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconCalculator size={20} color="var(--mantine-color-orange-6)" />
            <Text size="lg" fw={600}>
              Account Types
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Manage account categories and classifications
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>
      </SimpleGrid>
    </Box>
  );
}

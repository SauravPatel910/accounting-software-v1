import { Box, Text, Card, SimpleGrid, Button, Group } from "@mantine/core";
import { IconCreditCard, IconBuildingBank, IconRefresh } from "@tabler/icons-react";

export function Transactions() {
  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>
            Transactions
          </Text>
          <Text size="sm" c="dimmed">
            Track and manage all financial transactions
          </Text>
        </Box>
        <Button leftSection={<IconCreditCard size={16} />}>Add Transaction</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconCreditCard size={20} color="var(--mantine-color-blue-6)" />
            <Text size="lg" fw={600}>
              All Transactions
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            View all financial transactions and entries
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconBuildingBank size={20} color="var(--mantine-color-green-6)" />
            <Text size="lg" fw={600}>
              Bank Accounts
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Manage connected bank accounts and balances
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>

        <Card shadow="xs" padding="lg" radius="md" withBorder>
          <Group gap="sm" mb="md">
            <IconRefresh size={20} color="var(--mantine-color-orange-6)" />
            <Text size="lg" fw={600}>
              Reconciliation
            </Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            Reconcile bank statements with your records
          </Text>
          <Button variant="light" fullWidth>
            Coming Soon
          </Button>
        </Card>
      </SimpleGrid>
    </Box>
  );
}

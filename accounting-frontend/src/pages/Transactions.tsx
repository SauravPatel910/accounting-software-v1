import { Box, Text, Card, SimpleGrid, Button, Group, Tabs } from "@mantine/core";
import { IconCreditCard, IconBuildingBank, IconRefresh, IconList } from "@tabler/icons-react";
import { TransactionList } from "../components/banking";

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

      <Tabs defaultValue="all-transactions">
        <Tabs.List>
          <Tabs.Tab value="all-transactions" leftSection={<IconList size={16} />}>
            All Transactions
          </Tabs.Tab>
          <Tabs.Tab value="bank-accounts" leftSection={<IconBuildingBank size={16} />}>
            Bank Accounts
          </Tabs.Tab>
          <Tabs.Tab value="reconciliation" leftSection={<IconRefresh size={16} />}>
            Reconciliation
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all-transactions" pt="xl">
          <TransactionList />
        </Tabs.Panel>

        <Tabs.Panel value="bank-accounts" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconBuildingBank size={20} color="var(--mantine-color-green-6)" />
                <Text size="lg" fw={600}>
                  Connected Accounts
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
                <IconCreditCard size={20} color="var(--mantine-color-blue-6)" />
                <Text size="lg" fw={600}>
                  Import Transactions
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Import transactions from bank statements
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>

            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconRefresh size={20} color="var(--mantine-color-orange-6)" />
                <Text size="lg" fw={600}>
                  Sync Status
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                View synchronization status and last updates
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="reconciliation" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconRefresh size={20} color="var(--mantine-color-orange-6)" />
                <Text size="lg" fw={600}>
                  Bank Reconciliation
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Reconcile bank statements with your records
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>

            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconCreditCard size={20} color="var(--mantine-color-blue-6)" />
                <Text size="lg" fw={600}>
                  Credit Card Reconciliation
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Match credit card transactions and statements
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

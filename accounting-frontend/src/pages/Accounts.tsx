import { Box, Text, Card, SimpleGrid, Button, Group, Tabs } from "@mantine/core";
import { IconCalculator, IconPlus, IconList, IconBuildingBank } from "@tabler/icons-react";
import { useState } from "react";
import { BankAccountList } from "../components/banking";
import { AddAccountModal, AccountList } from "../components/accounts";

export function Accounts() {
  const [addAccountModalOpened, setAddAccountModalOpened] = useState(false);

  const handleAddAccountSuccess = () => {
    // Refresh the accounts list or show success message
    console.log("Account added successfully");
  };

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
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAddAccountModalOpened(true)}>
          Add Account
        </Button>
      </Group>

      <Tabs defaultValue="bank-accounts">
        <Tabs.List>
          <Tabs.Tab value="bank-accounts" leftSection={<IconBuildingBank size={16} />}>
            Bank Accounts
          </Tabs.Tab>
          <Tabs.Tab value="chart-accounts" leftSection={<IconList size={16} />}>
            Chart of Accounts
          </Tabs.Tab>
          <Tabs.Tab value="account-types" leftSection={<IconCalculator size={16} />}>
            Account Types
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="bank-accounts" pt="xl">
          <BankAccountList />
        </Tabs.Panel>

        <Tabs.Panel value="chart-accounts" pt="xl">
          <AccountList />
        </Tabs.Panel>

        <Tabs.Panel value="account-types" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconCalculator size={20} color="var(--mantine-color-orange-6)" />
                <Text size="lg" fw={600}>
                  Asset Accounts
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Cash, inventory, equipment, and other assets
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>

            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconCalculator size={20} color="var(--mantine-color-red-6)" />
                <Text size="lg" fw={600}>
                  Liability Accounts
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Accounts payable, loans, and other liabilities
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>

            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconCalculator size={20} color="var(--mantine-color-blue-6)" />
                <Text size="lg" fw={600}>
                  Equity Accounts
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Owner's equity, retained earnings, and capital
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <AddAccountModal
        opened={addAccountModalOpened}
        onClose={() => setAddAccountModalOpened(false)}
        onSuccess={handleAddAccountSuccess}
      />
    </Box>
  );
}

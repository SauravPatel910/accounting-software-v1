// prettier-ignore
import { Table, Group, Text, ActionIcon, Badge, Box, Button, Paper, Card, Stack, NumberFormatter, TextInput, Select, Flex } from "@mantine/core";
// prettier-ignore
import { IconEdit, IconTrash, IconEye, IconPlus, IconSearch, IconBuildingBank, IconCreditCard, IconWallet, IconCoins } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Decimal from "decimal.js";
import { useCurrency } from "../../hooks/useCurrency";
import { fetchBankAccounts, deleteBankAccount, type BankAccount } from "../../services/bankAccountService";

const accountTypeConfig = {
  checking: { icon: IconBuildingBank, color: "blue", label: "Checking" },
  savings: { icon: IconCoins, color: "green", label: "Savings" },
  credit: { icon: IconCreditCard, color: "red", label: "Credit Card" },
  cash: { icon: IconWallet, color: "orange", label: "Cash" },
  investment: { icon: IconCoins, color: "grape", label: "Investment" },
};

export function BankAccountList() {
  const { getCurrencySymbol } = useCurrency();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBankAccounts();
        setAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bank accounts");
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.includes(searchTerm);
    const matchesType = !filterType || account.accountType === filterType;
    return matchesSearch && matchesType;
  });

  const totalBalance = accounts
    .filter((acc) => acc.accountType !== "credit")
    .reduce((sum, acc) => sum.plus(acc.balance), new Decimal(0));

  const totalCreditBalance = accounts
    .filter((acc) => acc.accountType === "credit")
    .reduce((sum, acc) => sum.plus(Math.abs(acc.balance)), new Decimal(0));

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteBankAccount(id);
      setAccounts(accounts.filter((acc) => acc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bank account");
    }
  };

  const AccountIcon = ({ type }: { type: BankAccount["accountType"] }) => {
    const config = accountTypeConfig[type];
    const Icon = config.icon;
    return <Icon size={18} style={{ color: `var(--mantine-color-${config.color}-6)` }} />;
  };

  const AccountTypeBadge = ({ type }: { type: BankAccount["accountType"] }) => {
    const config = accountTypeConfig[type];
    return (
      <Badge variant="light" color={config.color} size="sm">
        {config.label}
      </Badge>
    );
  };

  const formatBalance = (balance: number, accountType: BankAccount["accountType"]) => {
    const isNegative = balance < 0;
    const displayBalance = accountType === "credit" ? Math.abs(balance) : balance;

    return (
      <NumberFormatter
        value={displayBalance}
        prefix={getCurrencySymbol()}
        thousandSeparator
        decimalScale={2}
        style={{
          color:
            accountType === "credit"
              ? "var(--mantine-color-red-6)"
              : isNegative
              ? "var(--mantine-color-red-6)"
              : "var(--mantine-color-green-6)",
        }}
      />
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Stack gap="lg">
        {/* Summary Cards */}
        <Group grow>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Total Assets
                </Text>
                <Text size="xl" fw={700} c="green">
                  <NumberFormatter
                    value={totalBalance.toNumber()}
                    prefix={getCurrencySymbol()}
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconCoins size={32} style={{ color: "var(--mantine-color-green-6)" }} />
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Total Credit
                </Text>
                <Text size="xl" fw={700} c="red">
                  <NumberFormatter
                    value={totalCreditBalance.toNumber()}
                    prefix={getCurrencySymbol()}
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconCreditCard size={32} style={{ color: "var(--mantine-color-red-6)" }} />
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Net Worth
                </Text>
                <Text size="xl" fw={700} c="blue">
                  <NumberFormatter
                    value={totalBalance.minus(totalCreditBalance).toNumber()}
                    prefix={getCurrencySymbol()}
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconBuildingBank size={32} style={{ color: "var(--mantine-color-blue-6)" }} />
            </Group>
          </Card>
        </Group>

        {/* Header and Controls */}
        <Group justify="space-between">
          <Box>
            <Text size="xl" fw={700}>
              Bank Accounts
            </Text>
            <Text size="sm" c="dimmed">
              Manage your chart of accounts and banking connections
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={16} />}>Add Account</Button>
        </Group>

        {/* Filters */}
        <Paper p="md" radius="md" withBorder>
          <Flex gap="md" align="end">
            <TextInput
              placeholder="Search accounts..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Account type"
              data={[
                { value: "checking", label: "Checking" },
                { value: "savings", label: "Savings" },
                { value: "credit", label: "Credit Card" },
                { value: "cash", label: "Cash" },
                { value: "investment", label: "Investment" },
              ]}
              value={filterType}
              onChange={setFilterType}
              clearable
              style={{ minWidth: 150 }}
            />
            {(searchTerm || filterType) && (
              <Button
                variant="light"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType(null);
                }}>
                Clear
              </Button>
            )}
          </Flex>
        </Paper>

        {/* Accounts Table */}
        <Paper shadow="xs" radius="md" withBorder>
          {loading ? (
            <Box p="xl" ta="center">
              <Text>Loading bank accounts...</Text>
            </Box>
          ) : error ? (
            <Box p="xl" ta="center">
              <Text c="red">{error}</Text>
              <Button mt="md" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Box>
          ) : (
            <Table verticalSpacing="md" horizontalSpacing="lg">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Account</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Bank</Table.Th>
                  <Table.Th>Account Number</Table.Th>
                  <Table.Th>Balance</Table.Th>
                  <Table.Th>Last Sync</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredAccounts.map((account) => (
                  <Table.Tr key={account.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <AccountIcon type={account.accountType} />
                        <Box>
                          <Text fw={500}>{account.name}</Text>
                          {account.description && (
                            <Text size="xs" c="dimmed">
                              {account.description}
                            </Text>
                          )}
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <AccountTypeBadge type={account.accountType} />
                    </Table.Td>
                    <Table.Td>
                      <Text>{account.bankName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text ff="monospace">{account.accountNumber}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>{formatBalance(account.balance, account.accountType)}</Text>
                    </Table.Td>
                    <Table.Td>
                      {account.lastSyncDate ? (
                        <Text size="sm" c="dimmed">
                          {new Date(account.lastSyncDate).toLocaleDateString()}
                        </Text>
                      ) : (
                        <Text size="sm" c="red">
                          Never
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="subtle" color="blue">
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="gray">
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteAccount(account.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {!loading && !error && filteredAccounts.length === 0 && (
            <Box p="xl" ta="center">
              <Text c="dimmed">No bank accounts found matching your criteria.</Text>
            </Box>
          )}
        </Paper>
      </Stack>
    </motion.div>
  );
}

import { useState } from "react";
import { NavLink, useLocation } from "react-router";
// prettier-ignore
import { Box, Group, ScrollArea, Text, UnstyledButton, rem, useMantineTheme, Collapse } from "@mantine/core";
// prettier-ignore
import { IconDashboard, IconFileInvoice, IconCreditCard, IconUsers, IconReport, IconSettings, IconChevronRight, IconCoins, IconCalculator, IconPackage, IconTestPipe, IconReceipt } from "@tabler/icons-react";

const mainNavigation = [
  {
    label: "Dashboard",
    icon: IconDashboard,
    link: "/",
    color: "blue",
  },
  {
    label: "Demo Center",
    icon: IconTestPipe,
    link: "/demo",
    color: "pink",
  },
  {
    label: "Invoices",
    icon: IconFileInvoice,
    link: "/invoices",
    color: "green",
    subItems: [
      { label: "All Invoices", link: "/invoices" },
      { label: "Create Invoice", link: "/invoices/create" },
      { label: "Recurring", link: "/invoices/recurring" },
    ],
  },
  {
    label: "Transactions",
    icon: IconCreditCard,
    link: "/transactions",
    color: "orange",
    subItems: [
      { label: "All Transactions", link: "/transactions" },
      { label: "Bank Accounts", link: "/transactions/accounts" },
      { label: "Reconciliation", link: "/transactions/reconcile" },
    ],
  },
  {
    label: "Products",
    icon: IconPackage,
    link: "/products",
    color: "violet",
  },
  {
    label: "Expenses",
    icon: IconReceipt,
    link: "/expenses",
    color: "red",
  },
  {
    label: "Customers",
    icon: IconUsers,
    link: "/customers",
    color: "grape",
  },
  {
    label: "Chart of Accounts",
    icon: IconCalculator,
    link: "/accounts",
    color: "teal",
  },
  {
    label: "Reports",
    icon: IconReport,
    link: "/reports",
    color: "indigo",
    subItems: [
      { label: "Profit & Loss", link: "/reports/profit-loss" },
      { label: "Balance Sheet", link: "/reports/balance-sheet" },
      { label: "Cash Flow", link: "/reports/cash-flow" },
      { label: "Tax Reports", link: "/reports/tax" },
    ],
  },
  {
    label: "Settings",
    icon: IconSettings,
    link: "/settings",
    color: "gray",
  },
];

interface NavItemProps {
  icon: React.ComponentType<{
    size?: number;
    stroke?: number;
    color?: string;
    style?: React.CSSProperties;
  }>;
  label: string;
  link: string;
  color: string;
  subItems?: { label: string; link: string }[];
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, link, color, subItems, active, onClick }: NavItemProps) {
  const theme = useMantineTheme();
  const location = useLocation();
  const [opened, setOpened] = useState(false);

  const hasSubItems = subItems && subItems.length > 0;
  const isSubItemActive = subItems?.some((item) => location.pathname === item.link);
  const isMainActive = location.pathname === link && !hasSubItems;
  const shouldHighlight = isMainActive || isSubItemActive || active;

  const handleClick = () => {
    if (hasSubItems) {
      setOpened(!opened);
    }
    onClick?.();
  };

  const buttonStyle = {
    display: "block",
    width: "100%",
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    color: shouldHighlight ? theme.colors[color][6] : theme.colors.gray[7],
    backgroundColor: shouldHighlight ? theme.colors[color][0] : "transparent",
    textDecoration: "none",
    border: "none",
  };

  return (
    <Box>
      {hasSubItems ? (
        <UnstyledButton onClick={handleClick} style={buttonStyle}>
          <Group gap="sm" wrap="nowrap">
            <Icon
              size={20}
              stroke={1.5}
              color={shouldHighlight ? theme.colors[color][6] : undefined}
            />
            <Text size="sm" style={{ flex: 1 }}>
              {label}
            </Text>
            <IconChevronRight
              size={16}
              style={{
                transform: opened ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
              }}
              stroke={1.5}
            />
          </Group>
        </UnstyledButton>
      ) : (
        <UnstyledButton component={NavLink} to={link} style={buttonStyle}>
          <Group gap="sm" wrap="nowrap">
            <Icon
              size={20}
              stroke={1.5}
              color={shouldHighlight ? theme.colors[color][6] : undefined}
            />
            <Text size="sm" style={{ flex: 1 }}>
              {label}
            </Text>
          </Group>
        </UnstyledButton>
      )}

      {hasSubItems && (
        <Collapse in={opened}>
          <Box pl="xl" pt="xs">
            {subItems.map((item) => (
              <UnstyledButton
                key={item.link}
                component={NavLink}
                to={item.link}
                style={{
                  display: "block",
                  width: "100%",
                  padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                  borderRadius: theme.radius.sm,
                  color:
                    location.pathname === item.link ? theme.colors[color][6] : theme.colors.gray[6],
                  backgroundColor:
                    location.pathname === item.link ? theme.colors[color][0] : "transparent",
                  textDecoration: "none",
                  fontSize: theme.fontSizes.sm,
                  border: "none",
                }}>
                <Text size="xs">{item.label}</Text>
              </UnstyledButton>
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

interface SidebarProps {
  width?: number;
}

export function Sidebar({ width = 260 }: SidebarProps) {
  const theme = useMantineTheme();

  return (
    <Box
      style={{
        width: rem(width),
        height: "100vh",
        backgroundColor: theme.white,
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        display: "flex",
        flexDirection: "column",
      }}>
      {/* Logo/Brand Section */}
      <Box
        p="md"
        style={{
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
        }}>
        <Group gap="sm">
          <IconCoins size={28} color={theme.colors.blue[6]} />
          <Text size="lg" fw={700} c={theme.colors.blue[6]}>
            AccounTech
          </Text>
        </Group>
      </Box>

      {/* Navigation */}
      <ScrollArea style={{ flex: 1 }} p="md">
        <Box>
          {mainNavigation.map((item) => (
            <Box key={item.label} mb="xs">
              <NavItem {...item} />
            </Box>
          ))}
        </Box>
      </ScrollArea>

      {/* Footer Section */}
      <Box
        p="md"
        style={{
          borderTop: `1px solid ${theme.colors.gray[3]}`,
        }}>
        <Text size="xs" c="dimmed" ta="center">
          v1.0.0 Beta
        </Text>
      </Box>
    </Box>
  );
}

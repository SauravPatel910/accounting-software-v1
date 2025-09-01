import { useState } from "react";
import { NavLink, useLocation } from "react-router";
// prettier-ignore
import { Box, Group, ScrollArea, Text, UnstyledButton, rem, useMantineTheme, Collapse } from "@mantine/core";
// prettier-ignore
import { IconDashboard, IconFileInvoice, IconCreditCard, IconUsers, IconReport, IconSettings, IconChevronRight, IconCoins, IconCalculator, IconPackage, IconTestPipe, IconReceipt } from "@tabler/icons-react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";

// Animation variants for navigation items
const navContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const navItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

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
    <motion.div
      variants={navItemVariants}
      whileHover={{
        scale: 1.02,
        x: 4,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}>
      {hasSubItems ? (
        <UnstyledButton onClick={handleClick} style={buttonStyle}>
          <Group gap="sm" wrap="nowrap">
            <motion.div whileHover={{ rotate: 5, scale: 1.1 }} transition={{ duration: 0.2 }}>
              <Icon
                size={20}
                stroke={1.5}
                color={shouldHighlight ? theme.colors[color][6] : undefined}
              />
            </motion.div>
            <Text size="sm" style={{ flex: 1 }}>
              {label}
            </Text>
            <motion.div
              animate={{ rotate: opened ? 90 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}>
              <IconChevronRight size={16} stroke={1.5} />
            </motion.div>
          </Group>
        </UnstyledButton>
      ) : (
        <UnstyledButton component={NavLink} to={link} style={buttonStyle}>
          <Group gap="sm" wrap="nowrap">
            <motion.div whileHover={{ rotate: 5, scale: 1.1 }} transition={{ duration: 0.2 }}>
              <Icon
                size={20}
                stroke={1.5}
                color={shouldHighlight ? theme.colors[color][6] : undefined}
              />
            </motion.div>
            <Text size="sm" style={{ flex: 1 }}>
              {label}
            </Text>
          </Group>
        </UnstyledButton>
      )}

      {hasSubItems && (
        <Collapse in={opened}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <Box pl="xl" pt="xs">
              {subItems.map((item, index) => (
                <motion.div
                  key={item.link}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                  whileHover={{ x: 4, scale: 1.01 }}>
                  <UnstyledButton
                    component={NavLink}
                    to={item.link}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                      borderRadius: theme.radius.sm,
                      color:
                        location.pathname === item.link
                          ? theme.colors[color][6]
                          : theme.colors.gray[6],
                      backgroundColor:
                        location.pathname === item.link ? theme.colors[color][0] : "transparent",
                      textDecoration: "none",
                      fontSize: theme.fontSizes.sm,
                      border: "none",
                    }}>
                    <Text size="xs">{item.label}</Text>
                  </UnstyledButton>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        </Collapse>
      )}
    </motion.div>
  );
}

interface SidebarProps {
  width?: number;
}

export function Sidebar({ width = 260 }: SidebarProps) {
  const theme = useMantineTheme();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={navContainerVariants}
      style={{
        width: rem(width),
        height: "100vh",
        backgroundColor: theme.white,
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        display: "flex",
        flexDirection: "column",
      }}>
      {/* Logo/Brand Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          padding: theme.spacing.md,
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
        }}>
        <Group gap="sm">
          <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
            <IconCoins size={28} color={theme.colors.blue[6]} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}>
            <Text size="lg" fw={700} c={theme.colors.blue[6]}>
              AccounTech
            </Text>
          </motion.div>
        </Group>
      </motion.div>

      {/* Navigation */}
      <ScrollArea style={{ flex: 1 }} p="md">
        <motion.div variants={navContainerVariants} initial="hidden" animate="visible">
          {mainNavigation.map((item, index) => (
            <motion.div
              key={item.label}
              variants={navItemVariants}
              custom={index}
              style={{ marginBottom: theme.spacing.xs }}>
              <NavItem {...item} />
            </motion.div>
          ))}
        </motion.div>
      </ScrollArea>

      {/* Footer Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.4 }}
        style={{
          padding: theme.spacing.md,
          borderTop: `1px solid ${theme.colors.gray[3]}`,
        }}>
        <Text size="xs" c="dimmed" ta="center">
          v1.0.0 Beta
        </Text>
      </motion.div>
    </motion.div>
  );
}

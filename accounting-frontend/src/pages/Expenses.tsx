import { useState } from "react";
import { Container, Tabs, rem } from "@mantine/core";
import { IconReceipt, IconBuilding, IconFileInvoice } from "@tabler/icons-react";
import { VendorList, VendorForm } from "../components/vendors";
import { BillList, BillForm, ExpenseList, ExpenseForm } from "../components/expenses";
import { type Vendor, type Bill, type Expense } from "../services/api";

type ModalType =
  | { type: "vendor-form"; vendor?: Vendor }
  | { type: "bill-form"; bill?: Bill }
  | { type: "expense-form"; expense?: Expense }
  | null;

export function Expenses() {
  const [activeTab, setActiveTab] = useState<string | null>("vendors");
  const [modal, setModal] = useState<ModalType>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const iconStyle = { width: rem(12), height: rem(12) };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const closeModal = () => {
    setModal(null);
    handleRefresh();
  };

  return (
    <Container size="xl" py="md">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="vendors" leftSection={<IconBuilding style={iconStyle} />}>
            Vendors
          </Tabs.Tab>
          <Tabs.Tab value="bills" leftSection={<IconFileInvoice style={iconStyle} />}>
            Bills
          </Tabs.Tab>
          <Tabs.Tab value="expenses" leftSection={<IconReceipt style={iconStyle} />}>
            Expenses
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="vendors" pt="md">
          <VendorList
            key={`vendors-${refreshKey}`}
            onCreateVendor={() => setModal({ type: "vendor-form" })}
            onEditVendor={(vendor) => setModal({ type: "vendor-form", vendor })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="bills" pt="md">
          <BillList
            key={`bills-${refreshKey}`}
            onCreateBill={() => setModal({ type: "bill-form" })}
            onEditBill={(bill) => setModal({ type: "bill-form", bill })}
          />
        </Tabs.Panel>

        <Tabs.Panel value="expenses" pt="md">
          <ExpenseList
            key={`expenses-${refreshKey}`}
            onCreateExpense={() => setModal({ type: "expense-form" })}
            onEditExpense={(expense) => setModal({ type: "expense-form", expense })}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Modals */}
      <VendorForm
        opened={modal?.type === "vendor-form"}
        onClose={() => setModal(null)}
        onSuccess={closeModal}
        vendor={modal?.type === "vendor-form" ? modal.vendor : undefined}
      />

      <BillForm
        opened={modal?.type === "bill-form"}
        onClose={() => setModal(null)}
        onSuccess={closeModal}
        bill={modal?.type === "bill-form" ? modal.bill : undefined}
      />

      <ExpenseForm
        opened={modal?.type === "expense-form"}
        onClose={() => setModal(null)}
        onSuccess={closeModal}
        expense={modal?.type === "expense-form" ? modal.expense : undefined}
      />
    </Container>
  );
}

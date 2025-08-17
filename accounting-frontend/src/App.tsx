import { BrowserRouter, Routes, Route } from "react-router";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Home</div>}>
          {/* Future routes */}
          <Route index element={<div>Home Page</div>} />
          <Route path="invoices" element={<div>Invoices - Coming Soon</div>} />
          <Route path="transactions" element={<div>Transactions - Coming Soon</div>} />
          <Route path="reports" element={<div>Reports - Coming Soon</div>} />
          <Route path="customers" element={<div>Customers - Coming Soon</div>} />
          <Route path="settings" element={<div>Settings - Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

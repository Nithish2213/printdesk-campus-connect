
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PrintProvider } from "./contexts/PrintContext";

// Pages
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

// Student Pages
import StudentLayout from "./pages/student/StudentLayout";
import Upload from "./pages/student/Upload";
import Payment from "./pages/student/Payment";
import Track from "./pages/student/Track";
import History from "./pages/student/History";
import Profile from "./pages/student/Profile";

// Xerox Pages
import XeroxLayout from "./pages/xerox/XeroxLayout";
import Orders from "./pages/xerox/Orders";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import StaffManagement from "./pages/admin/StaffManagement";
import RevenueAnalytics from "./pages/admin/RevenueAnalytics";
import InventoryManagement from "./pages/admin/InventoryManagement";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PrintProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route path="upload" element={<Upload />} />
              <Route path="payment/:orderId" element={<Payment />} />
              <Route path="track" element={<Track />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Xerox Routes */}
            <Route path="/xerox" element={<XeroxLayout />}>
              <Route path="orders" element={<Orders />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="staff" element={<StaffManagement />} />
              <Route path="revenue" element={<RevenueAnalytics />} />
              <Route path="inventory" element={<InventoryManagement />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PrintProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

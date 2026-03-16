import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import CheckIn from "@/pages/CheckIn";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCreate from "@/pages/AdminCreate";
import VisitorQrCheckIn from "@/pages/VisitorQrCheckIn";
import NotFound from "@/pages/NotFound";

const App = () => (
  <>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-create" element={<AdminCreate />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/visit/:id" element={<VisitorQrCheckIn />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;

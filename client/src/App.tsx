import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import Login from "@/pages/login";
import Register from "@/pages/register";
import SetupPin from "@/pages/setup-pin";
import PendingApproval from "@/pages/pending-approval";
import ClientDashboard from "@/pages/client-dashboard";
import AdvisorDashboard from "@/pages/advisor-dashboard";
import MyCards from "@/pages/my-cards";
import MyAccount from "@/pages/my-account";
import Transfers from "@/pages/transfers";
import BiometricSettings from "@/pages/biometric-settings";
import CardView from "@/pages/card-view";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/setup-pin" component={SetupPin} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/client" component={ClientDashboard} />
      <Route path="/advisor" component={AdvisorDashboard} />
      <Route path="/my-cards" component={MyCards} />
      <Route path="/my-account" component={MyAccount} />
      <Route path="/transfers" component={Transfers} />
      <Route path="/biometric-settings" component={BiometricSettings} />
      <Route path="/card-view" component={CardView} />
    </Switch>
  );
}

function App() {
  const device = useDeviceDetection();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={`${device.isDesktop ? 'w-full min-w-full' : 'w-full'} bg-background min-h-screen relative`}>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

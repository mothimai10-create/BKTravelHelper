import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import Splash from "@/pages/splash";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import CreateTrip from "@/pages/create-trip";
import EditTrip from "@/pages/edit-trip";
import TripLocation from "@/pages/trip-location";
import TripBudget from "@/pages/trip-budget";
import TripSpending from "@/pages/trip-spending";
import TripDashboard from "@/pages/trip-dashboard";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element | null }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/home">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/create-trip">
        {() => <ProtectedRoute component={CreateTrip} />}
      </Route>
      <Route path="/trip/:id/edit">
        {() => <ProtectedRoute component={EditTrip} />}
      </Route>
      <Route path="/trip/:id/dashboard">
        {() => <ProtectedRoute component={TripDashboard} />}
      </Route>
      <Route path="/trip/:id/location">
        {() => <ProtectedRoute component={TripLocation} />}
      </Route>
      <Route path="/trip/:id/budget">
        {() => <ProtectedRoute component={TripBudget} />}
      </Route>
      <Route path="/trip/:id/spending">
        {() => <ProtectedRoute component={TripSpending} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
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
import TripMembers from "@/pages/trip-members";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element | null }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function AuthValidator() {
  const { user, setUser, clearUser } = useAuth();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Validate session on app load
    const validateSession = async () => {
      try {
        const response = await apiRequest('/api/auth/me');
        const serverUser = response.user;

        if (serverUser) {
          // Session is valid on server
          if (!user || user.id !== serverUser.id) {
            // Update local user if different
            setUser(serverUser);
          }
        } else {
          // No valid session on server
          if (user) {
            // Clear stale local user
            clearUser();
          }
        }
      } catch (error) {
        // If validation fails, clear user to be safe
        if (user) {
          clearUser();
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, []);

  // Don't render routes until validation is complete
  if (isValidating) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return null;
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
      <Route path="/trip/:id/members">
        {() => <ProtectedRoute component={TripMembers} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <TooltipProvider>
      <Toaster />
      <AuthValidator />
      <Router />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

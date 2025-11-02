import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { MapPin, IndianRupee, Plane } from "lucide-react";
import { ProfessionalIcon } from "@/components/professional-icon";

export default function Splash() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative h-screen flex items-center justify-center gradient-white-black"
      >
        <div className="text-center text-white px-4">
          <img src="/logo.png" alt="BKTravel Helper" className="h-24 md:h-32 w-auto mx-auto mb-4" data-testid="text-title" />
          <p className="text-xl md:text-2xl mb-12 text-white/90" data-testid="text-tagline">
            Plan, manage, and share your travel adventures
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground hover:opacity-90 shadow-lg"
              onClick={() => navigate('/register')}
              data-testid="button-signup"
            >
              Sign Up
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 shadow-lg"
              onClick={() => navigate('/login')}
              data-testid="button-login"
            >
              Login
            </Button>
          </div>
        </div>
      </div>

      <div className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center transition-transform duration-300 hover:scale-105" data-testid="card-feature-plan">
            <div className="flex justify-center mb-4">
              <ProfessionalIcon size="xl" background bgColor="primary">
                <MapPin className="w-8 h-8" />
              </ProfessionalIcon>
            </div>
            <h3 className="text-2xl font-semibold mb-2">Plan Trips</h3>
            <p className="text-muted-foreground">
              Create detailed itineraries with interactive maps and multiple stops
            </p>
          </div>
          <div className="text-center transition-transform duration-300 hover:scale-105" data-testid="card-feature-budget">
            <div className="flex justify-center mb-4">
              <ProfessionalIcon size="xl" background bgColor="success">
                <IndianRupee className="w-8 h-8" />
              </ProfessionalIcon>
            </div>
            <h3 className="text-2xl font-semibold mb-2">Track Budgets</h3>
            <p className="text-muted-foreground">
              Manage expenses and split costs equally among group members
            </p>
          </div>
          <div className="text-center transition-transform duration-300 hover:scale-105" data-testid="card-feature-share">
            <div className="flex justify-center mb-4">
              <ProfessionalIcon size="xl" background bgColor="accent">
                <Plane className="w-8 h-8" />
              </ProfessionalIcon>
            </div>
            <h3 className="text-2xl font-semibold mb-2">Share Updates</h3>
            <p className="text-muted-foreground">
              Keep everyone informed with live location updates and notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

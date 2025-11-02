import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plane, MapPin, IndianRupee } from "lucide-react";

export default function Splash() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="relative h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center text-white px-4">
          <h1 className="font-serif text-6xl md:text-8xl font-bold mb-4" data-testid="text-title">
            BKTravel Helper
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90" data-testid="text-tagline">
            Plan, manage, and share your travel adventures
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              className="bg-primary/90 backdrop-blur-sm hover:bg-primary"
              onClick={() => navigate('/register')}
              data-testid="button-signup"
            >
              Sign Up
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20"
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
          <div className="text-center" data-testid="card-feature-plan">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Plan Trips</h3>
            <p className="text-muted-foreground">
              Create detailed itineraries with interactive maps and multiple stops
            </p>
          </div>
          <div className="text-center" data-testid="card-feature-budget">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <IndianRupee className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Track Budgets</h3>
            <p className="text-muted-foreground">
              Manage expenses and split costs equally among group members
            </p>
          </div>
          <div className="text-center" data-testid="card-feature-share">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Plane className="w-8 h-8 text-primary" />
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

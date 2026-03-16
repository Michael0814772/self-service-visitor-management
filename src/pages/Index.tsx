import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Users, Shield } from "lucide-react";
import homepageOverlay from "@/assets/image/homepage-overlay.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4"
      style={{
        backgroundImage: `url(${homepageOverlay})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Single gradient overlay: softer on left, stronger on right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background/10"
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="flex flex-col items-center md:grid md:grid-cols-2 md:items-center">
          {/* Left column: empty (for image emphasis) */}
          <div className="hidden md:block" />

          {/* Right column: Visitor Management content, centered in its 50% */}
          <div className="flex w-full items-center justify-center">
            <div className="w-full max-w-sm text-center bg-white/90 backdrop-blur-sm rounded-lg p-14">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/90 backdrop-blur">
              <Users className="h-6 w-6 text-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                Visitor Management
              </h1>
              <p className="mt-5 text-sm text-muted-foreground">
                Self-service check-in system. Register your visit or sign in as an
                administrator.
              </p>

              <div className="mt-14 space-y-3">
                <Button
                  onClick={() => navigate("/check-in")}
                  className="h-10 w-full gap-2"
                >
                  <Users className="h-4 w-4" /> Check In
                </Button>
                <Button
                  onClick={() => navigate("/admin/login")}
                  variant="outline"
                  className="h-10 w-full gap-2"
                >
                  <Shield className="h-4 w-4" /> Admin Login
                </Button>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                Powered by{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text font-semibold tracking-wide text-transparent">
                  Group&nbsp;8
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

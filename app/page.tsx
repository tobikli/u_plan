"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Logo from "@/public/uplan.svg";
import LightRays from "@/components/LightRays";
import { useTheme } from "next-themes";

export default function Home() {
  const handleTryItNow = () => {
    window.location.href = "/app";
  };
  const { resolvedTheme } = useTheme();
  const raysColor = resolvedTheme === "dark" ? "#7dd3fc" : "#ffffff";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Background Light Rays */}
      <div className="absolute inset-0 -z-10">
        <LightRays
          raysOrigin="top-center"
          raysColor={raysColor}
          raysSpeed={1}
          lightSpread={0.6}
          rayLength={10}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="custom-rays w-full h-full"
        />
      </div>

      {/* Page Content */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10 relative z-10">
        <div className="fixed top-5 right-5 z-50">
          <ModeToggle />
        </div>

        <div className="w-full max-w-sm">
          <Card className="mb-6 rounded-lg p-6 text-center shadow-lg flex flex-col items-center gap-4">
            <Logo className="size-20 text-black dark:text-white" />
            <h1 className="text-2xl font-bold">Welcome to U_Plan</h1>

            <Carousel
              className="m-10 p-8 border rounded-xl"
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 3000 })]}
            >
              <CarouselContent>
                <CarouselItem>
                  Your personal University Program Manager
                </CarouselItem>
                <CarouselItem>
                  Overview of all your courses and tasks
                </CarouselItem>
                <CarouselItem>
                  To your degree with successive planning
                </CarouselItem>
              </CarouselContent>
            </Carousel>

            <Button variant="outline" onClick={handleTryItNow}>
              Try it now!
            </Button>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-black dark:text-white" />
            <span>
              © {new Date().getFullYear()} U_PLAN /{" "}
              <a className="underline" href="https://tobiwn.me">
                Tobias Klingenberg
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a className="hover:text-foreground" href="/app">
              Dashboard
            </a>
            <a className="hover:text-foreground" href="/app/studies">
              Studies
            </a>
            <a className="hover:text-foreground" href="/app/courses">
              Courses
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

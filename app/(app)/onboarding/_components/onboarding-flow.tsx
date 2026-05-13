"use client";

import { useState } from "react";
import type {
  Preferences,
  Profile,
  Space,
} from "@/lib/types/database";
import { LocationStep, type LocationData } from "./location-step";
import { PreferencesStep } from "./preferences-step";
import { ProgressIndicator } from "./progress-indicator";
import { SpacesStep } from "./spaces-step";

type Step = 1 | 2 | 3;

type OnboardingFlowProps = {
  initialStep: Step;
  profile: Profile;
  spaces: Space[];
  preferences: Preferences | null;
};

function profileToReveal(profile: Profile): LocationData | null {
  if (
    !profile.hardiness_zone ||
    !profile.last_frost_date ||
    !profile.first_frost_date
  ) {
    return null;
  }
  return {
    zone: profile.hardiness_zone,
    lastFrost: profile.last_frost_date,
    firstFrost: profile.first_frost_date,
    displayName: profile.address ?? "",
  };
}

export function OnboardingFlow({
  initialStep,
  profile,
  spaces,
  preferences,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(initialStep);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 pt-10 pb-24 sm:px-6 sm:pt-16 sm:pb-12">
      <ProgressIndicator current={step} />

      {step === 1 && (
        <LocationStep
          initialAddress={profile.address}
          initialReveal={profileToReveal(profile)}
          onComplete={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <SpacesStep
          initialSpaces={spaces}
          onComplete={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <PreferencesStep
          initialPreferences={preferences}
          onBack={() => setStep(2)}
        />
      )}
    </main>
  );
}

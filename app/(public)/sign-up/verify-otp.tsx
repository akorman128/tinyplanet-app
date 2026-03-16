import { router } from "expo-router";
import { useVerifyOtpAndCreateProfile, useSignUpWithPhoneNumber } from "@/hooks/useSignUp";
import { OtpVerificationScreen } from "@/components/OtpVerificationScreen";

export default function Page() {
  const verifyOtpAndCreateProfile = useVerifyOtpAndCreateProfile();
  const signUpWithPhoneNumber = useSignUpWithPhoneNumber();

  return (
    <OtpVerificationScreen
      isLoaded={true}
      onVerifyOtp={async (phone, token) => {
        await verifyOtpAndCreateProfile.mutateAsync({ phone, token });
        // Navigate to send invites page after successful verification
        // router.replace("/onboarding/send-invites");
      }}
      onResendCode={async (phone) => {
        await signUpWithPhoneNumber.mutateAsync({ phone });
      }}
    />
  );
}

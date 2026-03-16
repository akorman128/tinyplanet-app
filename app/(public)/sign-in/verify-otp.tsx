import { useVerifySignInOtp } from "@/hooks/useSignIn";
import { OtpVerificationScreen } from "@/components/OtpVerificationScreen";

export default function VerifyOtp() {
  const verifyOtp = useVerifySignInOtp();

  return (
    <OtpVerificationScreen
      isLoaded={true}
      onVerifyOtp={async (phone, token) => {
        await verifyOtp.mutateAsync({ phone, token });
      }}
    />
  );
}

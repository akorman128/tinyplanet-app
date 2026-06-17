import { useSignUpWithPhoneNumber } from "@/hooks/useSignUp";
import { PhoneInputScreen } from "@/components/PhoneInputScreen";

export default function Page() {
  const signUpWithPhoneNumber = useSignUpWithPhoneNumber();

  return (
    <PhoneInputScreen
      isLoaded={true}
      onSubmitPhone={async (phone) => {
        await signUpWithPhoneNumber.mutateAsync({ phone });
      }}
      heading="Create your account"
      subheading=""
      buttonText="Continue"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkPath="/sign-in/phone-number"
      verifyOtpPath="/sign-up/verify-otp"
    />
  );
}

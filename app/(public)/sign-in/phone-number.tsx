import { useSignInWithPhoneNumber } from "@/hooks/useSignIn";
import { PhoneInputScreen } from "@/components/PhoneInputScreen";

export default function SignInPage() {
  const signInWithPhoneNumber = useSignInWithPhoneNumber();

  return (
    <PhoneInputScreen
      isLoaded={true}
      onSubmitPhone={async (phone) => {
        await signInWithPhoneNumber.mutateAsync({ phone });
      }}
      heading="Welcome back"
      buttonText="Continue"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkPath="/sign-up/invite-code"
      verifyOtpPath="/sign-in/verify-otp"
    />
  );
}

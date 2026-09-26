// pharmacy-web/src/components/common/ReCaptchaWrapper.jsx (do not remove this comment)
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const ReCaptchaWrapper = ({ children }) => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_GOOGLE_CAPTCHA_ID}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default ReCaptchaWrapper;
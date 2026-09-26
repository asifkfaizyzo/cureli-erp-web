// cadmin-web/src/pages/Cadmin-Login/ReCaptchaWrapper.jsx (do not remove this comment)
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const ReCaptchaWrapper = ({ children }) => {
  const siteKey = import.meta.env.VITE_GOOGLE_CAPTCHA_ID ; 

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
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

// landing-web/src/pages/landingPages/contact/components/MapSection.jsx (do not remove this comment)
const MapSection = () => {
  return (
    <div className="w-full">
      <iframe
        title="Google Map"
        width="100%"
        height="450"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3930.0437754015066!2d76.35415337480406!3d9.99327669010488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b080d314f395279%3A0xc833f9062e3003c!2sKochi%20Metro%20Rail%20Limited!5e0!3m2!1sen!2sin!4v1700999999999"
      ></iframe>
    </div>
  );
};

export default MapSection;

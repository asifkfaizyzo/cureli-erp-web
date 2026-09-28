// cadmin-web/src/pages/marketplace/Orders/comps/tabs/DeliveryTab.jsx (do not remove this comment)
import DeliveryTrackingPanel from "../panels/DeliveryTrackingPanel";

const DeliveryTab = ({ order, onUpdated }) => {
  return <DeliveryTrackingPanel order={order} onUpdated={onUpdated} />;
};

export default DeliveryTab;
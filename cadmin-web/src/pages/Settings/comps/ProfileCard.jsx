// cadmin-web/src/pages/Settings/comps/ProfileCard.jsx (do not remove this comment)
import { useState } from "react";
import {
  User, Mail, Phone, Lock,
  Calendar, Edit3, AtSign, Shield, Clock,
} from "lucide-react";

import ContactModal        from "./ContactModal";
import IdentityModal       from "./IdentityModal";
import ChangePasswordModal from "./ChangePasswordModal";
import NoPermission        from "../../../components/common/NoPermission";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS }  from "../../../config/cadminPermissions";

const ProfileCard = ({ profile, onUpdate }) => {
  // is_super_cadmin controls identity editing at service level
  // but permission constants control UI visibility
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();

  const canEditIdentity = isSuperCAdmin; // identity edit is super admin only (enforced by service)
  const canEditContact  = isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.SETTINGS_EDIT_CONTACT);
  const canEditPassword = isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.SETTINGS_EDIT_PASSWORD);

  const [modal, setModal] = useState(null);

  const closeModal = (message) => {
    setModal(null);
    if (message) onUpdate(message);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }) : "N/A";

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }) : "Never";

  const formatPhone = (p) => {
    if (!p) return "Not set";
    return p.length === 10 ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p;
  };

  const getRoleBadge = (role) => {
    if (!role) return "bg-gray-100 text-gray-700 border-gray-200";
    if (role.toUpperCase().includes("SUPER"))
      return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  };

  // ── Info row — unchanged ──────────────────────────────────────────────────
  const InfoItem = ({ icon: Icon, label, value, onEdit, badge }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl
                    border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center
                        justify-center flex-shrink-0">
          <Icon size={18} className="text-[#000060]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          {badge ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                              text-xs font-semibold border mt-0.5 ${getRoleBadge(value)}`}>
              {value}
            </span>
          ) : (
            <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
          )}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                     text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10
                     rounded-lg transition-colors flex-shrink-0 ml-3"
        >
          <Edit3 size={12} /> Edit
        </button>
      )}
    </div>
  );

  // ── Section wrapper — only change: editButton replaced by canEdit check ───
  const Section = ({ title, children, editLabel, onEdit, canEdit }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3
                      bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {/* Show edit button if permitted, pill if not, nothing if no edit needed */}
        {canEdit === true && onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10
                       rounded-lg transition-colors"
          >
            <Edit3 size={12} /> {editLabel || "Edit"}
          </button>
        )}
        {canEdit === false && onEdit !== undefined && (
          <NoPermission variant="pill" icon="lock" title="No access" />
        )}
        {/* canEdit === undefined means section has no edit at all (read-only) */}
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );

  return (
    <>
      <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm
                      overflow-hidden flex flex-col">
        {/* Card header — unchanged */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50
                        flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#000060] flex items-center
                            justify-center text-white text-lg font-bold flex-shrink-0">
              {profile.name?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{profile.name}</h2>
              <p className="text-xs text-gray-500">@{profile.username}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                            text-xs font-semibold border ${getRoleBadge(profile.primary_role)}`}>
            {profile.is_super_cadmin ? "Super Admin" : (profile.primary_role || "No Role")}
          </span>
        </div>

        {/* Sections */}
        <div className="p-6 flex-1 overflow-auto space-y-4">

          {/* Identity — only super admins can edit */}
          <Section
            title="Identity"
            editLabel="Edit Identity"
            onEdit={() => setModal("identity")}
            canEdit={canEditIdentity}
          >
            <InfoItem icon={User}   label="Full Name" value={profile.name} />
            <InfoItem icon={AtSign} label="Username"  value={`@${profile.username}`} />
          </Section>

          {/* Contact — gated by SETTINGS_EDIT_CONTACT */}
          <Section
            title="Contact Information"
            editLabel="Edit Contact"
            onEdit={() => setModal("contact")}
            canEdit={canEditContact}
          >
            <InfoItem icon={Mail}  label="Email Address" value={profile.email || "Not set"} />
            <InfoItem icon={Phone} label="Phone Number"  value={formatPhone(profile.phone)} />
          </Section>

          {/* Security — gated by SETTINGS_EDIT_PASSWORD */}
          <Section
            title="Security"
            editLabel="Change Password"
            onEdit={() => setModal("password")}
            canEdit={canEditPassword}
          >
            <InfoItem icon={Lock} label="Password" value="••••••••••••" />
          </Section>

          {/* Account info — read only, no canEdit prop = no button at all */}
          <Section title="Account Information">
            <InfoItem
              icon={Shield}
              label="Role"
              value={profile.is_super_cadmin ? "Super Admin" : (profile.primary_role || "No Role")}
              badge
            />
            <InfoItem icon={Clock}    label="Last Login"   value={formatDateTime(profile.lastLogin)} />
            <InfoItem icon={Calendar} label="Member Since" value={formatDate(profile.createdAt)} />
          </Section>
        </div>
      </div>

      {/* Modals — only mount if user has permission */}
      {modal === "contact" && canEditContact && (
        <ContactModal
          currentEmail={profile.email}
          currentPhone={profile.phone}
          onClose={closeModal}
        />
      )}
      {modal === "identity" && canEditIdentity && (
        <IdentityModal
          currentName={profile.name}
          currentUsername={profile.username}
          onClose={closeModal}
        />
      )}
      {modal === "password" && canEditPassword && (
        <ChangePasswordModal onClose={closeModal} />
      )}
    </>
  );
};

export default ProfileCard;
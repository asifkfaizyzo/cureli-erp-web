// cadmin-web/src/pages/Audit/comps/AuditDetailPanel.jsx (do not remove this comment)
// ============================================
// AUDIT DETAIL MODAL - Horizontal Layout
// ============================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Copy,
  ExternalLink,
  Clock,
  User,
  Target,
  Store,
  GitBranch,
  Globe,
  Monitor,
  FileJson,
  Hash,
  Link2,
  Calendar,
  ArrowRight,
} from 'lucide-react';

import { useToast } from '../../../components/common/Toast';
import {
  getActionConfig,
  getActionCategory,
  getEntityTypeConfig,
  getActorTypeConfig,
  getReasonCodeConfig,
  SEVERITY_CONFIG,
} from '../../../config/modules/auditConfig';

// ============================================
// HELPER COMPONENTS
// ============================================

const InfoCard = ({ icon: Icon, label, children, className = '' }) => (
  <div className={`bg-gray-50 rounded-xl p-4 ${className}`}>
    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      <Icon size={14} />
      {label}
    </div>
    {children}
  </div>
);

const DataItem = ({ label, value, mono = false, copyable = false, onCopy }) => {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-200/50 last:border-b-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm text-gray-900 text-right truncate max-w-[180px] ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </span>
        {copyable && onCopy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(value);
            }}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors flex-shrink-0"
            title="Copy"
          >
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

// ============================================
// MAIN COMPONENT
// ============================================

const AuditDetailPanel = ({ log, isOpen, onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Copy to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(String(text));
    toast.success('Copied', 'Copied to clipboard', 1500);
  };

  // Copy raw JSON
  const handleCopyRawJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    toast.success('Copied', 'Raw JSON copied to clipboard', 1500);
  };

  // Navigate to entity
  const handleNavigateToEntity = () => {
    if (!log) return;
    const entityConfig = getEntityTypeConfig(log.entity_type);
    if (entityConfig.route && log.entity_id) {
      navigate(`${entityConfig.route}${log.entity_id}`);
      onClose();
    }
  };

  if (!isOpen || !log) return null;

  // Get configs
  const actionConfig = getActionConfig(log.action);
  const actionCategory = getActionCategory(log.action);
  const severityConfig = SEVERITY_CONFIG[actionConfig.severity] || SEVERITY_CONFIG.info;
  const actorConfig = getActorTypeConfig(log.actor_type);
  const entityConfig = getEntityTypeConfig(log.entity_type);
  const reasonConfig = log.reason_code ? getReasonCodeConfig(log.reason_code) : null;

  const ActionIcon = actionConfig.icon;
  const ActorIcon = actorConfig.icon;
  const EntityIcon = entityConfig.icon;

  // Format timestamp
  const timestamp = new Date(log.created_at);
  const formattedDate = timestamp.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = timestamp.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Check if entity is navigable
  const canNavigateToEntity = entityConfig.route && log.entity_id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════ */}
        <div className={`px-6 py-4 border-b-2 ${severityConfig.borderColor} ${severityConfig.bgColor}`}>
          <div className="flex items-center justify-between">
            {/* Left: Action Info */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${severityConfig.bgColor} border-2 ${severityConfig.borderColor}`}>
                <ActionIcon size={24} className={severityConfig.color} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className={`text-xl font-bold ${severityConfig.color}`}>
                    {actionConfig.label}
                  </h2>
                  {actionCategory && (
                    <Badge className={`${actionCategory.bgColor} ${actionCategory.color} border ${actionCategory.borderColor}`}>
                      {actionCategory.label}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {actionConfig.description}
                </p>
              </div>
            </div>

            {/* Right: Timestamp & Close */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Calendar size={14} className="text-gray-400" />
                  {formattedDate}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {formattedTime}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-colors"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            CONTENT - Horizontal Grid Layout
        ════════════════════════════════════════════ */}
        <div className="p-6">
          {/* Row 1: Actor, Entity, Context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Actor Card */}
            <InfoCard icon={User} label="Who (Actor)">
              <div className="flex items-center gap-2 mb-3">
                <span className={`p-2 rounded-lg ${actorConfig.bgColor}`}>
                  <ActorIcon size={16} className={actorConfig.color} />
                </span>
                <div>
                  <div className="font-semibold text-gray-900">{log.actor_name || 'Unknown'}</div>
                  <Badge className={`${actorConfig.bgColor} ${actorConfig.color} mt-1`}>
                    {actorConfig.label}
                  </Badge>
                </div>
              </div>
              <DataItem label="Role" value={log.actor_role} />
              <DataItem label="ID" value={log.actor_id?.slice(0, 8) + '...'} mono copyable onCopy={() => handleCopy(log.actor_id)} />
              {log.actor_email && <DataItem label="Email" value={log.actor_email} />}
            </InfoCard>

            {/* Entity Card */}
            <InfoCard icon={Target} label="What (Entity)">
              <div className="flex items-center gap-2 mb-3">
                <span className={`p-2 rounded-lg ${entityConfig.bgColor}`}>
                  <EntityIcon size={16} className={entityConfig.color} />
                </span>
                <div>
                  <div className="font-semibold text-gray-900">{log.entity_name || 'N/A'}</div>
                  <Badge className={`${entityConfig.bgColor} ${entityConfig.color} mt-1`}>
                    {entityConfig.label}
                  </Badge>
                </div>
              </div>
              <DataItem label="ID" value={log.entity_id?.slice(0, 8) + '...'} mono copyable onCopy={() => handleCopy(log.entity_id)} />
              {canNavigateToEntity && (
                <button
                  onClick={handleNavigateToEntity}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 
                             bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium
                             hover:bg-indigo-200 transition-colors"
                >
                  View {entityConfig.label}
                  <ArrowRight size={14} />
                </button>
              )}
            </InfoCard>

            {/* Context Card */}
            <InfoCard icon={Link2} label="Context">
              {log.shop_name ? (
                <div className="flex items-center gap-2 mb-2">
                  <Store size={14} className="text-purple-500" />
                  <span className="text-sm font-medium text-gray-900">{log.shop_name}</span>
                </div>
              ) : null}
              {log.branch_name ? (
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch size={14} className="text-teal-500" />
                  <span className="text-sm font-medium text-gray-900">{log.branch_name}</span>
                </div>
              ) : null}
              {reasonConfig && (
                <div className="mb-2">
                  <Badge className={`${reasonConfig.bgColor} ${reasonConfig.color}`}>
                    {reasonConfig.label}
                  </Badge>
                </div>
              )}
              {!log.shop_name && !log.branch_name && !reasonConfig && (
                <span className="text-sm text-gray-400">No additional context</span>
              )}
              {log.correlation_id && (
                <DataItem 
                  label="Correlation" 
                  value={log.correlation_id?.slice(0, 8) + '...'} 
                  mono 
                  copyable 
                  onCopy={() => handleCopy(log.correlation_id)} 
                />
              )}
            </InfoCard>
          </div>

          {/* Row 2: Request Info & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Request Info Card */}
            <InfoCard icon={Globe} label="Request Info">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">IP Address</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
                      {log.ip_address || 'N/A'}
                    </code>
                    {log.ip_address && (
                      <button
                        onClick={() => handleCopy(log.ip_address)}
                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Audit ID</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border truncate max-w-[120px]">
                      {log.audit_id?.slice(0, 12)}...
                    </code>
                    <button
                      onClick={() => handleCopy(log.audit_id)}
                      className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
              {log.user_agent && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Monitor size={12} />
                    User Agent
                  </div>
                  <p className="text-xs text-gray-600 bg-white p-2 rounded border break-all line-clamp-2">
                    {log.user_agent}
                  </p>
                </div>
              )}
            </InfoCard>

            {/* Metadata Card */}
            <InfoCard icon={FileJson} label="Metadata" className="relative">
              {log.metadata && Object.keys(log.metadata).length > 0 ? (
                <div className="bg-gray-900 rounded-lg p-3 max-h-[140px] overflow-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[100px] text-gray-400 text-sm">
                  No metadata available
                </div>
              )}
            </InfoCard>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════ */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {/* Left: IDs */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Hash size={12} />
              {log.audit_id?.slice(0, 8)}
            </span>
            {log.shop_id && (
              <span className="flex items-center gap-1">
                <Store size={12} />
                {log.shop_id?.slice(0, 8)}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRawJSON}
              className="flex items-center gap-2 px-4 py-2 
                         bg-gray-100 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-200 transition-colors"
            >
              <FileJson size={16} />
              Copy JSON
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 
                         bg-[#05015A] text-white rounded-lg text-sm font-medium
                         hover:bg-[#0a0280] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditDetailPanel;
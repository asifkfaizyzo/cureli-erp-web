// pharmacy-web/src/components/common/Toast/ToastContainer.jsx (do not remove this comment)
// src/components/common/Toast/ToastContainer.jsx
import { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast";

// Create Context
const ToastContext = createContext(null);

// Generate unique ID
let toastId = 0;
const generateId = () => `toast-${++toastId}-${Date.now()}`;

// Toast Provider Component
export const ToastProvider = ({ 
  children, 
  position = "top-right", 
  limit = 5,
  defaultDuration = 4000,
}) => {
  const [toasts, setToasts] = useState([]);

  // Position classes
  const positionClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  };

  const addToast = useCallback(({ type, title, message, duration = defaultDuration }) => {
    const id = generateId();
    
    setToasts((prev) => {
      const newToasts = prev.length >= limit ? prev.slice(1) : prev;
      return [...newToasts, { id, type, title, message, duration }];
    });
    
    return id;
  }, [limit, defaultDuration]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Create toast object with methods
  const toast = useCallback((message, options = {}) => {
    return addToast({ 
      type: options.type || "info", 
      title: options.title, 
      message,
      duration: options.duration 
    });
  }, [addToast]);

  // Attach type-specific methods
  toast.success = (title, message, duration) => 
    addToast({ type: "success", title, message, duration });
  
  toast.error = (title, message, duration) => 
    addToast({ type: "error", title, message, duration });
  
  toast.warning = (title, message, duration) => 
    addToast({ type: "warning", title, message, duration });
  
  toast.info = (title, message, duration) => 
    addToast({ type: "info", title, message, duration });
  
  toast.dismiss = removeToast;
  toast.dismissAll = removeAllToasts;

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Container */}
      <div 
        className={`
          fixed z-[9999] flex flex-col gap-3 pointer-events-none 
          ${positionClasses[position]}
        `}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toastData, index) => (
          <div 
            key={toastData.id} 
            className="pointer-events-auto"
            style={{
              // Subtle stacking effect
              transform: `translateY(${index * 2}px)`,
              zIndex: toasts.length - index,
            }}
          >
            <Toast
              {...toastData}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;
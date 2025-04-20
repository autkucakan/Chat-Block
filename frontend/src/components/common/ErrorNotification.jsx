import { useEffect, useState } from 'react';
import './ErrorNotification.css';

const ErrorNotification = ({ message, onClose, autoHideDuration = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (message) {
      setVisible(true);
      
      // Auto-hide after specified duration
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration, onClose]);

  if (!message || !visible) return null;

  return (
    <div className="error-notification">
      <div className="error-content">
        <p>{message}</p>
        <button onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ErrorNotification; 
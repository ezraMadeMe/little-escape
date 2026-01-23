// Simple toast notification utility
export const showToast = (message: string, duration: number = 3000) => {
  // Remove any existing toast
  const existingToast = document.getElementById('custom-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'custom-toast';
  toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-charcoal-soft/95 backdrop-blur-lg text-off-white px-6 py-4 rounded-2xl shadow-lg border border-charcoal-lighter z-[100] animate-slide-up';
  toast.textContent = message;

  // Add to DOM
  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 20px)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

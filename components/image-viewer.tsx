import { X } from "lucide-react";
import { useEffect } from "react";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export function ImageViewer({ isOpen, onClose, imageUrl, alt }: ImageViewerProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-50 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img 
        src={imageUrl} 
        alt={alt || "Full screen view"} 
        className="max-w-[90vw] max-h-[90vh] object-contain cursor-default"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

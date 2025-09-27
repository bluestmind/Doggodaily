import React from "react";

export default function GalleryItem({ item }) {
  return (
    <div className="bg-white/80 rounded-xl shadow-lg overflow-hidden flex items-center justify-center aspect-square">
      <img src={item.src} alt={item.alt} className="object-cover w-full h-full" />
    </div>
  );
} 
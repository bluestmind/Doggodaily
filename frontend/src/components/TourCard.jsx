import React from "react";

export default function TourCard({ tour }) {
  return (
    <div className="bg-white/80 rounded-xl shadow-lg p-6 flex flex-col md:flex-row gap-6 items-center">
      <img src={tour.image} alt={tour.title} className="w-40 h-40 object-cover rounded-lg border-4 border-[#00faf3]" />
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-[#00faf3] mb-2">{tour.title}</h2>
        <div className="mb-2 text-gray-700">
          <span className="font-semibold">Date:</span> {tour.date} <br />
          <span className="font-semibold">Location:</span> {tour.location} <br />
          <span className="font-semibold">Price:</span> {tour.price}
        </div>
        <p className="mb-4 text-gray-800">{tour.description}</p>
        <button className="px-4 py-2 rounded bg-[#00faf3] text-white font-semibold hover:bg-[#00cfc3] transition">Book Now</button>
      </div>
    </div>
  );
} 
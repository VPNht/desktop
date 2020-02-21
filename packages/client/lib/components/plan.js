import React from "react";
const Plan = ({ type = "monthly", onClick }) => {
  const isMonthly = type === "MONTHLY";
  return (
    <div
      className="w-48 rounded overflow-hidden shadow-lg p-2 m-2 bg-gray-100 hover:bg-gray-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="px-4 py-4">
        <div className="font-bold text-xl mb-2 text-center">
          {isMonthly ? "1 Month" : "12 Months"}
        </div>
        <div className="text-gray-700 text-base px-6">
          <div className="block text-xs transform translate-y-3">ONLY</div>
          <div className="flex items-center">
            <span className="text-3xl">$</span>
            <span className="text-4xl">{isMonthly ? "1" : "3"}</span>
            <span className="text-3xl transform -translate-y-1">
              .{isMonthly ? "00" : "33"}
            </span>
          </div>
          <div className="block text-xs transform -translate-y-4 translate-x-10">
            /{isMonthly ? "first month" : "month"}
          </div>
        </div>
        <div
          className="p-1 mt-1 text-center bg-gray-400 text-gray-900"
          style={{ fontSize: "0.60rem" }}
        >
          {isMonthly ? "THEN $4.99/MONTH" : "$39.99 BILLED ANNUALLY"}
        </div>
      </div>
    </div>
  );
};

export default Plan;

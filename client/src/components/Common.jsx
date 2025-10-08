import React from "react";
import { motion } from "framer-motion";
import { Search, Filter, X } from "lucide-react";

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Tìm kiếm...", 
  className = "" 
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      {value && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
}

export function FilterSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Chọn bộ lọc",
  className = "" 
}) {
  return (
    <div className={`relative ${className}`}>
      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "blue", 
  trend,
  className = "" 
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600"
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 ${className}`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`ml-2 text-sm font-medium ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProgressBar({ 
  value, 
  max = 100, 
  color = "blue", 
  showLabel = true,
  label,
  className = "" 
}) {
  const percentage = (value / max) * 100;
  
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500"
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-600">{value}/{max}</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-2 rounded-full ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
}

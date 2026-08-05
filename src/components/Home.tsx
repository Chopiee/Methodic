import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  ShoppingCart, 
  DollarSign, 
  Eye, 
  TrendingUp 
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, CartesianGrid } from 'recharts';

const stats = [
  { title: 'Total Income', value: 'Rp 0', prev: 'Rp 0', change: '0%', icon: Activity },
  { title: 'Products Sold', value: '0', prev: '0', change: '0%', icon: ShoppingCart },
  { title: 'New Customers', value: '0', prev: '0', change: '0%', icon: Eye },
  { title: 'Profit', value: 'Rp 0', prev: 'Rp 0', change: '0%', icon: DollarSign },
  { title: 'Avg. Order Value', value: 'Rp 0', prev: 'Rp 0', change: '0%', icon: TrendingUp }
];

const halfPieData = [
  { name: 'Views', value: 0, fill: '#EA580C' },
  { name: 'Visits', value: 0, fill: '#1C1C1C' },
  { name: 'Empty', value: 100, fill: '#1C1C1C' }
];

const barData = [
  { name: 'Jan', value1: 0 },
  { name: 'Feb', value1: 0 },
  { name: 'Mar', value1: 0 },
  { name: 'Apr', value1: 0 },
  { name: 'May', value1: 0 },
  { name: 'Jun', value1: 0 },
  { name: 'Jul', value1: 0 },
  { name: 'Aug', value1: 0 },
  { name: 'Sep', value1: 0 }
];

const radialData = [
  { name: 'Label', uv: 0, fill: '#EF4444' }, // Innermost
  { name: 'Label', uv: 0, fill: '#F59E0B' },
  { name: 'Last Month', uv: 0, fill: '#10B981' },
  { name: 'Visits', uv: 0, fill: '#8B5CF6' },
  { name: 'Views', uv: 0, fill: '#EA580C' } // Outermost
];

export function Home() {
  const [chartTab, setChartTab] = useState('All Time');

  return (
    <div className="flex flex-col w-full h-full font-sans">
      <div className="pl-8 pr-8 pb-8 pt-[9px] overflow-y-auto flex-1">
        
        {/* Top Right Utilities & Actions Row */}
        <div className="flex items-start justify-between mb-8">
          <div className="pb-0" style={{ paddingBottom: '0px' }}>
            <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0 flex items-baseline" style={{ marginBottom: 0 }}>
              Welcome Back
            </h1>
            <p className="text-[13px] text-[#909090]">
              Here is your business summary for today.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-[#141517] border border-[#1C1C1C] rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-[#909090] mb-2 text-[13px] font-medium">
                  <span>{stat.title}</span>
                </div>
                <div className="text-xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                <div className="text-[11px] text-[#8E9097] flex items-center justify-between w-full mt-1">
                  <span>vs. {stat.prev} last period</span>
                  <span className="flex items-center gap-0.5 text-[#4ADE80] font-medium shrink-0">
                    <TrendingUp size={12} /> {stat.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-4">
          
          {/* Progress Half Chart Card */}
          <div className="bg-[#141517] border border-[#1C1C1C] rounded-xl p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium text-white text-[14px]">
                Progress Half Chart Card
              </div>
            </div>
            
            <div className="relative flex bg-[#1A1B1F] p-1 rounded-full border border-[#28292E] mb-6">
              {['Day', 'Week', 'Month', 'All Time'].map(tab => {
                const isActive = chartTab === tab;
                return (
                  <button 
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`relative flex-1 py-1.5 text-[12px] font-medium transition-colors duration-200 cursor-pointer ${
                      isActive ? 'text-white font-semibold' : 'text-[#9A9CA5] hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeChartTabPill"
                        className="absolute inset-0 bg-[#3A3C42] rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-0 mb-6 border-b border-[#1C1C1C] pb-4">
              <div className="border-r border-[#1C1C1C] pr-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#909090] mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EC4899]"></div> Income
                </div>
                <div className="font-bold text-white text-[14px]">Rp 0</div>
                <div className="text-[10px] text-[#4ADE80] flex items-center gap-0.5 mt-0.5"><TrendingUp size={10} /> 0%</div>
                <div className="text-[9px] text-[#666666] mt-0.5">vs. Rp 0 last</div>
              </div>
              <div className="border-r border-[#1C1C1C] px-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#909090] mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></div> Product
                </div>
                <div className="font-bold text-white text-[14px]">0</div>
                <div className="text-[10px] text-[#4ADE80] flex items-center gap-0.5 mt-0.5"><TrendingUp size={10} /> 0%</div>
                <div className="text-[9px] text-[#666666] mt-0.5">vs. 0 last</div>
              </div>
              <div className="pl-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#909090] mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div> Customers
                </div>
                <div className="font-bold text-white text-[14px]">0</div>
                <div className="text-[10px] text-[#4ADE80] flex items-center gap-0.5 mt-0.5"><TrendingUp size={10} /> 0%</div>
                <div className="text-[9px] text-[#666666] mt-0.5">vs. Rp 0 last</div>
              </div>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-end h-[140px] mb-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={halfPieData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {halfPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-2xl font-bold text-white">0</span>
                <span className="text-[10px] font-medium text-[#909090] tracking-wider">TOTAL</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-[#909090] mb-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#EA580C]"></div> Views</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1C1C1C]"></div> Visits</div>
            </div>
          </div>

          {/* Column Chart Card */}
          <div className="bg-[#141517] border border-[#1C1C1C] rounded-xl p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="font-medium text-white text-[14px]">
                Column Chart Card
              </div>
            </div>

            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C1C1C" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666666' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666666' }} />
                  <Tooltip 
                    cursor={{ fill: '#1C1C1C', opacity: 0.4 }} 
                    contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#2A2A2A', borderRadius: 8, fontSize: 12, color: 'white' }} 
                  />
                  <Bar dataKey="value1" fill="#EA580C" radius={[4, 4, 4, 4]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Chart (Radial) */}
          <div className="bg-[#141517] border border-[#1C1C1C] rounded-xl p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium text-white text-[14px]">
                Progress Chart
              </div>
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center min-h-[220px]">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={6} data={radialData}>
                  <RadialBar
                    minAngle={15}
                    background={{ fill: '#1C1C1C' }}
                    dataKey="uv"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="text-3xl font-bold text-white">0</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-[#909090] mb-2 px-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#EA580C]"></div> Views</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div> Visits</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Last Month</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div> Label</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#EF4444]"></div> Label</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { 
  Receipt, 
  Check, 
  PenTool, 
  Sparkles, 
  Activity, 
  Code, 
  Layers, 
  MonitorPlay, 
  Film, 
  Globe, 
  Megaphone 
} from 'lucide-react';

interface PlanProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  price: string;
  priceUnit: string;
  buttonText: string;
  buttonVariant: 'current' | 'upgrade';
  features: string[];
  highlight?: boolean;
  tag?: string;
}

const FeatureItem = ({ icon, label, beta }: { icon: React.ReactNode, label: string, beta?: boolean }) => (
  <div className="flex items-center gap-2">
    {icon}
    <span className="text-[14px] text-white tracking-tight">{label}</span>
    {beta && (
      <span className="px-1.5 py-[1px] rounded-[4px] bg-[#2E2E2E] text-[#A3A3A3] text-[11px] ml-0.5">
        Beta
      </span>
    )}
  </div>
);

function PlanCard({ icon, name, description, price, priceUnit, buttonText, buttonVariant, features, highlight, tag }: PlanProps) {
  const CardContent = () => (
    <div className={`p-5 flex flex-col h-full ${highlight ? 'bg-[#0E0E0E] rounded-2xl relative z-10' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="w-5 h-5 flex items-center">{icon}</div>
        {tag && <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#D1D1D1] text-[10px] px-2 py-0.5 rounded-full">{tag}</span>}
      </div>
      <h3 className="text-[14px] font-medium text-white mb-1">{name}</h3>
      <p className="text-[12px] text-[#909090] mb-5">{description}</p>
      
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-[28px] font-semibold text-white tracking-tight">{price}</span>
        <span className="text-[11px] text-[#909090]">{priceUnit}</span>
      </div>

      <button className={`w-full py-2 rounded-lg text-[12px] font-medium mb-6 transition-colors ${
        buttonVariant === 'current' 
        ? 'bg-[#1A1A1A] text-[#909090] cursor-default' 
        : 'bg-white text-black hover:bg-gray-100'
      }`}>
        {buttonText}
      </button>

      <div className="flex flex-col gap-2.5 mt-auto">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check size={12} className="text-[#2ECA7E]" strokeWidth={3} />
            <span className="text-[12px] text-[#A3A3A3] border-b border-dotted border-[#444444] pb-[1px]">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (highlight) {
    return (
      <div className="rounded-2xl p-[1.5px] bg-gradient-to-b from-[#4A88FF] via-[#E147FF] to-[#FF8C4A] h-full flex flex-col">
        <CardContent />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] h-full flex flex-col">
      <CardContent />
    </div>
  );
}

export function Billings() {
  return (
    <div className="flex flex-col w-full h-full font-sans">
      {/* Main Content Area */}
      <div className="px-8 pb-8 pt-[9px]">
        <h1 className="text-[18px] font-semibold text-white tracking-tight mb-0">Billings & Subscription</h1>
        <p className="text-[13px] text-[#909090] mb-8">
          Upgrade to enable unlimited tracking, enhanced security controls, and additional features.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PlanCard 
            icon={
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 relative">
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#0E0E0E] rounded-tl-full" />
              </div>
            }
            name="Individual"
            description="Ideal for tracking a small brand."
            price="$49"
            priceUnit="per user per month"
            buttonText="Current plan"
            buttonVariant="current"
            features={[
              "1 user",
              "Update every 12h",
              "AI Sentiment Analysis"
            ]}
          />
          <PlanCard 
            icon={
              <div className="flex items-center">
                <div className="w-3.5 h-3.5 bg-[#4A88FF] rounded-[2px] transform rotate-45" />
                <div className="w-3.5 h-3.5 bg-[#8E4AFF] rounded-[2px] transform rotate-45 -ml-1.5" />
              </div>
            }
            name="Team"
            description="Best for startups and small business."
            price="$299"
            priceUnit="per user per month"
            buttonText="Upgrade plan"
            buttonVariant="upgrade"
            highlight={true}
            features={[
              "Unlimited users",
              "Update every hour",
              "Priority support"
            ]}
          />
          <PlanCard 
            icon={
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#5C6B99] opacity-90" />
                <div className="w-4 h-4 rounded-full bg-[#404B6E] opacity-90 -ml-1.5" />
              </div>
            }
            name="Pro"
            description="Fitting a needs of growing business."
            price="$399"
            priceUnit="per user per month"
            buttonText="Upgrade plan"
            buttonVariant="upgrade"
            tag="Advance users"
            features={[
              "Realtime updated",
              "AI Events detection",
              "AI Insights"
            ]}
          />
          <PlanCard 
            icon={
              <div className="w-5 h-5 rounded-full bg-[#2ECA7E] relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-full h-full bg-[#0E0E0E] transform -rotate-12 translate-y-1" />
              </div>
            }
            name="Business"
            description="Ideal for scaling organizations."
            price="$799"
            priceUnit="per user per month"
            buttonText="Upgrade plan"
            buttonVariant="upgrade"
            features={[
              "SSO Integration",
              "Admin Controls",
              "Dedicated Support"
            ]}
          />
        </div>

        <div className="mt-12 mb-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-10">
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#2D3951] flex items-center justify-center"><PenTool size={11} className="text-[#8BB4FF]" /></div>} 
              label="Figma Design" 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#3B3B3B] flex items-center justify-center"><Sparkles size={11} className="text-[#C1C1C1]" /></div>} 
              label="Figma Make" 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#273B5E] flex items-center justify-center"><Activity size={11} className="text-[#72A6FF]" /></div>} 
              label="Figma Draw" 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#1C3B2B] flex items-center justify-center"><Code size={11} className="text-[#65D48D]" /></div>} 
              label="Dev Mode" 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#3D2C4F] flex items-center justify-center"><Layers size={11} className="text-[#C79CFF]" /></div>} 
              label="FigJam" 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#4F3025] flex items-center justify-center"><MonitorPlay size={11} className="text-[#FF9D72]" /></div>} 
              label="Figma Slides" 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#27354D] flex items-center justify-center"><Film size={11} className="text-[#89ACFF]" /></div>} 
              label="Figma Motion" 
              beta 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#2D2A4F] flex items-center justify-center"><Globe size={11} className="text-[#A29CFF]" /></div>} 
              label="Figma Sites" 
              beta 
            />
            <FeatureItem 
              icon={<div className="w-[20px] h-[20px] rounded-[4px] bg-[#4B2239] flex items-center justify-center"><Megaphone size={11} className="text-[#FF7DB9]" /></div>} 
              label="Figma Buzz" 
              beta 
            />
          </div>
          
          <p className="text-[13px] text-[#A3A3A3]">
            <a href="#" className="text-[#72A6FF] hover:underline">Learn more</a> about products and features. Applicable taxes will be calculated at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

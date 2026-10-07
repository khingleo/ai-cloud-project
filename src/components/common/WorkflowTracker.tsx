/**
 * MTN ENTERPRISE HUB - VISUAL ENTERPRISE LIFECYCLE WORKFLOW TRACKER
 * 
 * Visualizes the 9-stage end-to-end journey for presentations and operational tracking:
 * Customer -> Lead -> Opportunity -> Product -> Presales -> Documents -> Approval -> Service Delivery -> Active Service
 */

import React from 'react';
import {
  Building2,
  UserPlus,
  Flame,
  Layers,
  Wrench,
  FileCheck2,
  ShieldCheck,
  Truck,
  Activity,
  Check,
} from 'lucide-react';

export type EnterpriseWorkflowStep =
  | 'customer'
  | 'lead'
  | 'opportunity'
  | 'product'
  | 'presales'
  | 'documents'
  | 'approval'
  | 'delivery'
  | 'activeService';

interface WorkflowTrackerProps {
  currentStep: EnterpriseWorkflowStep;
  completedSteps?: EnterpriseWorkflowStep[];
  onStepClick?: (step: EnterpriseWorkflowStep) => void;
}

interface StepDefinition {
  id: EnterpriseWorkflowStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const STEPS: StepDefinition[] = [
  { id: 'customer', label: 'Customer', icon: Building2, description: 'Master account' },
  { id: 'lead', label: 'Lead', icon: UserPlus, description: 'Sourced & qualified' },
  { id: 'opportunity', label: 'Opportunity', icon: Flame, description: 'Pipeline deal' },
  { id: 'product', label: 'Product', icon: Layers, description: 'Service match' },
  { id: 'presales', label: 'Presales (TEF)', icon: Wrench, description: 'Feasibility & TFR' },
  { id: 'documents', label: 'Documents', icon: FileCheck2, description: 'Legal & Sign-off' },
  { id: 'approval', label: '6-Tier Approval', icon: ShieldCheck, description: 'CENO & DCLM' },
  { id: 'delivery', label: 'Service Delivery', icon: Truck, description: 'Field provisioning' },
  { id: 'activeService', label: 'Active Service', icon: Activity, description: 'Live SLA billing' },
];

export const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({
  currentStep,
  completedSteps = [],
  onStepClick,
}) => {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-mtn-md border border-slate-800">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-mtn-yellow animate-pulse" />
          <h4 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            MTN Enterprise End-to-End Lifecycle Journey
          </h4>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Step {currentIdx + 1} of {STEPS.length}:{' '}
          <strong className="text-mtn-yellow font-bold">{STEPS[currentIdx]?.label}</strong>
        </span>
      </div>

      {/* Horizontal scroll container on small screens */}
      <div className="overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center justify-between min-w-[780px] relative">
          {/* Background Connecting Line */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-700 -z-0" />

          {/* Active Highlight Line */}
          <div
            className="absolute top-5 left-6 h-0.5 bg-mtn-yellow transition-all duration-500 -z-0"
            style={{
              width: `${(currentIdx / (STEPS.length - 1)) * 94}%`,
            }}
          />

          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentIdx || completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;

            return (
              <div
                key={step.id}
                onClick={() => onStepClick && onStepClick(step.id)}
                className={`flex flex-col items-center group relative z-10 ${
                  onStepClick ? 'cursor-pointer' : ''
                }`}
                style={{ width: `${100 / STEPS.length}%` }}
              >
                {/* Node Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    isCurrent
                      ? 'bg-mtn-yellow text-black border-white shadow-mtn-glow scale-110 font-bold ring-4 ring-mtn-yellow/20'
                      : isCompleted
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:border-slate-500 group-hover:text-slate-200'
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`mt-2.5 text-xs font-semibold text-center leading-tight transition-colors ${
                    isCurrent
                      ? 'text-mtn-yellow font-bold'
                      : isCompleted
                      ? 'text-emerald-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {step.label}
                </span>

                <span className="text-[10px] text-slate-500 text-center hidden sm:block mt-0.5">
                  {step.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

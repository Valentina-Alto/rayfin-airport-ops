import {
  Badge,
  Card,
  ProgressBar,
  SectionTitle,
  riskColor,
  titleCase,
} from '@/components/dashboard/primitives';
import type {
  AirportDataset,
  DisruptionPrediction,
  GateAllocationRecommendation,
} from '@/domain/types';

function ModelBanner({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-800/60 to-slate-800/20 px-5 py-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-400">{description}</p>
      </div>
      <Badge className="text-sky-300 bg-sky-500/15 ring-sky-500/30">{badge}</Badge>
    </div>
  );
}

function DisruptionPanel({ disruptions }: { disruptions: DisruptionPrediction[] }) {
  const top = disruptions.slice(0, 10);
  return (
    <Card>
      <SectionTitle
        title="Disruption & delay forecast"
        subtitle="Logistic risk model · probability of ≥15 min delay"
      />
      <div className="overflow-x-auto px-2 pb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Flight</th>
              <th className="px-3 py-2 font-medium">Risk</th>
              <th className="px-3 py-2 font-medium w-40">Probability</th>
              <th className="px-3 py-2 font-medium">Pred. delay</th>
              <th className="px-3 py-2 font-medium">Key drivers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {top.map((d) => (
              <tr key={d.flightId} className="text-slate-300 hover:bg-slate-800/40">
                <td className="px-3 py-2">
                  <div className="font-mono text-slate-100">{d.flightNumber}</div>
                  <div className="text-xs text-slate-500">{d.airline}</div>
                </td>
                <td className="px-3 py-2">
                  <Badge className={riskColor[d.riskLevel]}>{titleCase(d.riskLevel)}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={d.probability}
                      className={
                        d.riskLevel === 'severe'
                          ? 'bg-rose-400'
                          : d.riskLevel === 'high'
                            ? 'bg-orange-400'
                            : d.riskLevel === 'moderate'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                      }
                    />
                    <span className="w-9 text-right text-xs text-slate-400">
                      {Math.round(d.probability * 100)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className={d.predictedDelayMinutes >= 15 ? 'text-amber-300' : 'text-slate-300'}>
                    +{d.predictedDelayMinutes}m
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {d.topFactors.map((f) => (
                      <span
                        key={f.label}
                        className="rounded-md bg-slate-700/50 px-1.5 py-0.5 text-[11px] text-slate-300"
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AllocationPanel({
  allocations,
}: {
  allocations: GateAllocationRecommendation[];
}) {
  return (
    <Card>
      <SectionTitle
        title="Gate allocation plan"
        subtitle="Constraint-aware optimizer · conflict-free assignments"
        action={
          <Badge className="text-emerald-300 bg-emerald-500/15 ring-emerald-500/30">
            {allocations.filter((a) => a.isReassignment).length} reassignments
          </Badge>
        }
      />
      <div className="overflow-x-auto px-2 pb-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Flight</th>
              <th className="px-3 py-2 font-medium">Gate</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
              <th className="px-3 py-2 font-medium">Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {allocations.slice(0, 12).map((a) => (
              <tr key={a.flightId} className="text-slate-300 hover:bg-slate-800/40">
                <td className="px-3 py-2">
                  <div className="font-mono text-slate-100">{a.flightNumber}</div>
                  <div className="text-xs text-slate-500">
                    {a.airline} · {titleCase(a.direction)}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono text-base font-semibold text-emerald-300">
                    {a.recommendedGateCode}
                  </span>
                  {a.isReassignment && a.currentGateCode && (
                    <div className="text-[11px] text-amber-300">
                      from {a.currentGateCode}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={a.confidence / 100} className="bg-emerald-400" />
                    <span className="w-9 text-right text-xs text-slate-400">{a.confidence}%</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {a.reasons.map((r) => (
                      <span
                        key={r}
                        className="rounded-md bg-slate-700/50 px-1.5 py-0.5 text-[11px] text-slate-300"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function PredictionsTab({
  data,
  disruptions,
  allocations,
}: {
  data: AirportDataset;
  disruptions: DisruptionPrediction[];
  allocations: GateAllocationRecommendation[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ModelBanner
          title="Gate Allocation Optimizer"
          description="Greedy constraint solver balancing size fit, jet bridges, terminal affinity and conflict-free scheduling."
          badge={`${allocations.length} planned`}
        />
        <ModelBanner
          title="Disruption Risk Model"
          description={`Logistic model over weather, congestion, turnaround load & current delay. Field condition: ${titleCase(
            data.conditions.condition
          )}.`}
          badge={`${disruptions.filter((d) => d.riskLevel === 'high' || d.riskLevel === 'severe').length} high risk`}
        />
      </div>
      <AllocationPanel allocations={allocations} />
      <DisruptionPanel disruptions={disruptions} />
    </div>
  );
}

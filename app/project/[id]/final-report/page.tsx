'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

type ComponentItem = {
  id: string;
  name: string;
  component_type: string;
  is_target?: boolean;
};

type FunctionRow = {
  id: string;
  carrier_component_id: string;
  action: string;
  object_component_id: string;
  category: string;
  performance: string;
  function_rank: string;
  score?: number;
  is_key_disadvantage?: boolean;
};

export default function FinalReportPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [charter, setCharter] = useState<any>(null);
  const [engineeringSystem, setEngineeringSystem] = useState<any>(null);
  const [sCurve, setSCurve] = useState<any>(null);

  const [components, setComponents] =
    useState<ComponentItem[]>([]);

  const [functions, setFunctions] =
    useState<FunctionRow[]>([]);

  const [technical, setTechnical] = useState<any>(null);
  const [physical, setPhysical] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [projectId]);

  async function loadReport() {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: projectData, error: projectError } =
      await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (projectError || !projectData) {
      setError(
        projectError?.message ||
          'Project could not be found.'
      );

      setLoading(false);
      return;
    }

    setProject(projectData);

    const [
      charterResult,
      engineeringResult,
      sCurveResult,
      componentsResult,
      functionsResult,
      technicalResult,
      physicalResult,
    ] = await Promise.all([
      supabase
        .from('project_charters')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle(),

      supabase
        .from('engineering_systems')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle(),

      supabase
        .from('s_curve')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle(),

      supabase
        .from('components')
        .select('*')
        .eq('project_id', projectId)
        .order('component_type')
        .order('sort_order'),

      supabase
        .from('function_model_rows')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at'),

      supabase
        .from('technical_contradictions')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle(),

      supabase
        .from('physical_contradictions')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle(),
    ]);

    const firstError =
      charterResult.error ||
      engineeringResult.error ||
      sCurveResult.error ||
      componentsResult.error ||
      functionsResult.error ||
      technicalResult.error ||
      physicalResult.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setCharter(charterResult.data);
    setEngineeringSystem(engineeringResult.data);
    setSCurve(sCurveResult.data);
    setComponents(componentsResult.data || []);
    setFunctions(functionsResult.data || []);
    setTechnical(technicalResult.data);
    setPhysical(physicalResult.data);

    setLoading(false);
  }

  function getComponentName(id: string) {
    return (
      components.find(
        (component) => component.id === id
      )?.name || 'Unknown component'
    );
  }

  function printReport() {
    window.print();
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-GB');
  }

  function displayValue(
    ...values: Array<string | null | undefined>
  ) {
    const value = values.find(
      (item) =>
        typeof item === 'string' &&
        item.trim().length > 0
    );

    return value || '—';
  }

  const systemComponents = useMemo(
    () =>
      components.filter(
        (component) =>
          component.component_type === 'System'
      ),
    [components]
  );

  const supersystemComponents = useMemo(
    () =>
      components.filter(
        (component) =>
          component.component_type === 'Supersystem'
      ),
    [components]
  );

  const keyDisadvantages = useMemo(
    () =>
      functions.filter(
        (row) =>
          row.is_key_disadvantage ||
          row.category === 'Harmful' ||
          row.performance === 'Inefficient' ||
          row.performance === 'Excessive'
      ),
    [functions]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">
          Preparing Final Report...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] px-6 text-[#123d36]">
        <div className="max-w-xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Final Report could not be loaded
          </h1>

          <p className="mt-4 text-red-700">
            {error}
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 rounded-xl bg-[#123d36] px-6 py-3 font-semibold text-white"
          >
            Back to My Projects
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .report-section {
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #d8d5ca !important;
          }

          .report-page {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-[#f4f2e9] text-[#123d36]">

        {/* HEADER */}

        <header className="no-print border-b border-[#d8d5ca] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-5">

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#57b89d]">
                TRIZup
              </p>

              <h1 className="text-xl font-bold">
                TRIZ Innovation Workspace
              </h1>
            </div>

            <button
              onClick={() =>
                router.push('/dashboard')
              }
              className="rounded-lg border border-[#123d36] px-5 py-2.5 text-sm font-semibold hover:bg-[#edf3f1]"
            >
              My Projects
            </button>

          </div>
        </header>

        <section className="report-page mx-auto max-w-6xl px-6 py-12">

          {/* REPORT TITLE */}

          <div className="mb-10">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#57b89d]">
              Step 10 of 10
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              Final Report
            </h2>

            <p className="mt-3 text-lg text-[#66736f]">
              {project?.name || 'TRIZ Project'}
            </p>

            <div className="no-print mt-6 flex flex-wrap gap-3">

              <button
                onClick={() =>
                  router.push(
                    `/project/${projectId}/physical-contradiction`
                  )
                }
                className="rounded-xl border border-[#123d36] px-6 py-3 font-semibold"
              >
                ← Back
              </button>

              <button
                onClick={printReport}
                className="rounded-xl bg-[#123d36] px-6 py-3 font-semibold text-white"
              >
                Print / Save as PDF
              </button>

            </div>

          </div>

          {/* COVER */}

          <div className="report-section mb-8 rounded-3xl bg-[#123d36] p-8 text-white shadow-sm">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7ed6bc]">
              TRIZ Innovation Workspace
            </p>

            <h1 className="mt-5 text-4xl font-bold">
              {project?.name}
            </h1>

            <div className="mt-8 grid gap-5 sm:grid-cols-3">

              <DarkInfo
                label="Created"
                value={formatDate(
                  project?.created_at
                )}
              />

              <DarkInfo
                label="Version"
                value={
                  charter?.version
                    ? String(charter.version)
                    : '1.0'
                }
              />

              <DarkInfo
                label="Status"
                value={
                  project?.status || 'Draft'
                }
              />

            </div>

          </div>

          {/* 1 PROJECT CHARTER */}

          <ReportSection
            number="01"
            title="Project Charter"
          >

            <ReportGrid>

              <ReportField
                label="Project Name"
                value={
                  charter?.project_name ||
                  project?.name
                }
              />

              <ReportField
                label="Date"
                value={formatDate(
                  charter?.project_date ||
                  charter?.date ||
                  project?.created_at
                )}
              />

              <ReportField
                label="Version"
                value={
                  charter?.version
                    ? String(charter.version)
                    : '—'
                }
              />

            </ReportGrid>

            <ReportText
              label="Business Case"
              value={displayValue(
                charter?.business_case
              )}
            />

            <div className="grid gap-6 lg:grid-cols-2">

              <ReportText
                label="Scope IN"
                value={displayValue(
                  charter?.scope_in
                )}
              />

              <ReportText
                label="Scope OUT"
                value={displayValue(
                  charter?.scope_out
                )}
              />

            </div>

            <ReportText
              label="Problem Statement"
              value={displayValue(
                charter?.problem_statement
              )}
            />

            <ReportText
              label="Roles"
              value={displayValue(
                charter?.roles,
                charter?.project_roles
              )}
            />

            <ReportText
              label="Goals / KPIs"
              value={displayValue(
                charter?.goals_kpis,
                charter?.goals,
                charter?.kpis
              )}
            />

            <ReportText
              label="Milestones"
              value={displayValue(
                charter?.milestones
              )}
            />

          </ReportSection>

          {/* 2 ENGINEERING SYSTEM */}

          <ReportSection
            number="02"
            title="Engineering System"
          >

            <ReportGrid>

              <ReportField
                label="Engineering System"
                value={displayValue(
                  engineeringSystem?.name,
                  engineeringSystem?.system_name
                )}
              />

              <ReportField
                label="Main Function"
                value={displayValue(
                  engineeringSystem?.main_function
                )}
              />

              <ReportField
                label="Action"
                value={displayValue(
                  engineeringSystem?.action
                )}
              />

              <ReportField
                label="Target"
                value={displayValue(
                  engineeringSystem?.target
                )}
              />

            </ReportGrid>

          </ReportSection>

          {/* 3 S-CURVE */}

          <ReportSection
            number="03"
            title="S-Curve Analysis"
          >

            <ReportText
              label="Main Development Parameter"
              value={displayValue(
                sCurve?.main_development_parameter,
                sCurve?.development_parameter
              )}
            />

            <ReportGrid>

              <ReportField
                label="Current Stage"
                value={displayValue(
                  sCurve?.stage,
                  sCurve?.current_stage,
                  sCurve?.classification
                )}
              />

              <ReportField
                label="Q1"
                value={displayValue(
                  sCurve?.question_1,
                  sCurve?.q1
                )}
              />

              <ReportField
                label="Q2"
                value={displayValue(
                  sCurve?.question_2,
                  sCurve?.q2
                )}
              />

              <ReportField
                label="Q3"
                value={displayValue(
                  sCurve?.question_3,
                  sCurve?.q3
                )}
              />

            </ReportGrid>

            <ReportText
              label="Recommendation"
              value={displayValue(
                sCurve?.recommendation,
                sCurve?.recommendations
              )}
            />

          </ReportSection>

          {/* 4 COMPONENTS */}

          <ReportSection
            number="04"
            title="System & Supersystem Components"
          >

            <div className="grid gap-6 lg:grid-cols-2">

              <ComponentList
                title="System Components"
                components={systemComponents}
              />

              <ComponentList
                title="Supersystem Components"
                components={
                  supersystemComponents
                }
              />

            </div>

          </ReportSection>

          {/* 5 INTERACTION MATRIX */}

          <ReportSection
            number="05"
            title="Interaction Matrix"
          >

            <p className="leading-7 text-[#66736f]">
              The Interaction Matrix was completed
              during the project analysis and used
              to determine valid Function Carrier
              and Object relationships for the
              Function Model.
            </p>

            <p className="mt-4 text-sm font-semibold">
              Components analysed:{' '}
              {components.length}
            </p>

          </ReportSection>

          {/* 6 FUNCTION MODEL */}

          <ReportSection
            number="06"
            title="Function Model"
          >

            {functions.length === 0 ? (

              <EmptyText />

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-[850px] w-full text-left text-sm">

                  <thead>
                    <tr className="border-b border-[#d8d5ca]">
                      <th className="p-3">
                        Carrier
                      </th>
                      <th className="p-3">
                        Action
                      </th>
                      <th className="p-3">
                        Object
                      </th>
                      <th className="p-3">
                        Category
                      </th>
                      <th className="p-3">
                        Performance
                      </th>
                      <th className="p-3">
                        Rank
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {functions.map((row) => (

                      <tr
                        key={row.id}
                        className="border-b border-[#ececea]"
                      >

                        <td className="p-3 font-semibold">
                          {getComponentName(
                            row.carrier_component_id
                          )}
                        </td>

                        <td className="p-3">
                          {row.action}
                        </td>

                        <td className="p-3 font-semibold">
                          {getComponentName(
                            row.object_component_id
                          )}
                        </td>

                        <td className="p-3">
                          {row.category}
                        </td>

                        <td className="p-3">
                          {row.performance}
                        </td>

                        <td className="p-3">
                          {row.function_rank}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </ReportSection>

          {/* 7 CECA */}

          <ReportSection
            number="07"
            title="CECA — Key Disadvantages"
          >

            {keyDisadvantages.length === 0 ? (

              <EmptyText text="No Key Disadvantages were identified." />

            ) : (

              <div className="space-y-3">

                {keyDisadvantages.map(
                  (row, index) => (

                    <div
                      key={row.id}
                      className="rounded-2xl border border-[#ead6d3] bg-red-50 p-5"
                    >

                      <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                        Key Disadvantage{' '}
                        {index + 1}
                      </p>

                      <p className="mt-2 font-semibold">
                        {getComponentName(
                          row.carrier_component_id
                        )}
                        {' → '}
                        {row.action}
                        {' → '}
                        {getComponentName(
                          row.object_component_id
                        )}
                      </p>

                      <p className="mt-2 text-sm text-red-700">
                        {row.category}
                        {' • '}
                        {row.performance}
                      </p>

                    </div>

                  )
                )}

              </div>

            )}

            <p className="mt-5 text-sm leading-6 text-[#66736f]">
              The detailed Cause and Effect Chain
              diagram is prepared outside the
              application using an external
              diagramming tool.
            </p>

          </ReportSection>

          {/* 8 TECHNICAL CONTRADICTION */}

          <ReportSection
            number="08"
            title="Technical Contradiction"
          >

            <div className="grid gap-6 lg:grid-cols-2">

              <ReportText
                label="Primary Technical Contradiction"
                value={displayValue(
                  technical?.primary_contradiction
                )}
              />

              <ReportText
                label="Reverse Technical Contradiction"
                value={displayValue(
                  technical?.reverse_contradiction
                )}
              />

            </div>

            <ParameterIds
              title="Improving Parameter IDs"
              ids={
                technical?.improving_parameter_ids ||
                []
              }
            />

            <ParameterIds
              title="Worsening Parameter IDs"
              ids={
                technical?.worsening_parameter_ids ||
                []
              }
            />

            <ReportText
              label="Proposed Solution"
              value={displayValue(
                technical?.proposed_solution
              )}
            />

          </ReportSection>

          {/* 9 PHYSICAL CONTRADICTION */}

          <ReportSection
            number="09"
            title="Physical Contradiction"
          >

            <div className="grid gap-6 lg:grid-cols-2">

              <div className="rounded-2xl bg-[#f5f5f2] p-5">

                <p className="text-sm font-bold text-[#57b89d]">
                  State 1
                </p>

                <p className="mt-3 whitespace-pre-line font-semibold">
                  {displayValue(
                    physical?.state_1
                  )}
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#66736f]">
                  {displayValue(
                    physical?.state_1_justification
                  )}
                </p>

              </div>

              <div className="rounded-2xl bg-[#f5f5f2] p-5">

                <p className="text-sm font-bold text-[#57b89d]">
                  State 2
                </p>

                <p className="mt-3 whitespace-pre-line font-semibold">
                  {displayValue(
                    physical?.state_2
                  )}
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#66736f]">
                  {displayValue(
                    physical?.state_2_justification
                  )}
                </p>

              </div>

            </div>

            <div className="mt-6">

              <h4 className="font-bold">
                Separation Analysis
              </h4>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <YesNo
                  label="Separation in Space"
                  value={
                    physical?.separate_space
                  }
                />

                <YesNo
                  label="Separation in Time"
                  value={
                    physical?.separate_time
                  }
                />

                <YesNo
                  label="Separation by Relation"
                  value={
                    physical?.separate_relation
                  }
                />

                <YesNo
                  label="System Level"
                  value={
                    physical?.separate_system_level
                  }
                />

                <YesNo
                  label="Direction"
                  value={
                    physical?.separate_direction
                  }
                />

                <YesNo
                  label="Satisfy Simultaneously"
                  value={
                    physical?.satisfy_simultaneously
                  }
                />

                <YesNo
                  label="Bypass"
                  value={
                    physical?.bypass
                  }
                />

              </div>

            </div>

            <ReportText
              label="Proposed Solution"
              value={displayValue(
                physical?.proposed_solution
              )}
            />

          </ReportSection>

          {/* FINAL */}

          <div className="report-section rounded-3xl bg-[#123d36] p-8 text-white shadow-sm">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#7ed6bc]">
              TRIZ Project Summary
            </p>

            <h3 className="mt-3 text-3xl font-bold">
              Analysis Complete
            </h3>

            <p className="mt-4 max-w-3xl leading-7 text-white/80">
              This report summarises the structured
              TRIZ analysis performed in the TRIZ
              Innovation Workspace, from the initial
              Project Charter and Engineering System
              through the Function Model, Technical
              Contradiction and Physical
              Contradiction.
            </p>

          </div>

          <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">

            <button
              onClick={() =>
                router.push(
                  `/project/${projectId}/physical-contradiction`
                )
              }
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
            >
              ← Back to Physical Contradiction
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                onClick={() =>
                  router.push('/dashboard')
                }
                className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
              >
                My Projects
              </button>

              <button
                onClick={printReport}
                className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white"
              >
                Print / Save as PDF
              </button>

            </div>

          </div>

        </section>

      </main>
    </>
  );
}

/* =========================================================
   REPORT COMPONENTS
   ========================================================= */

function ReportSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="report-section mb-8 rounded-3xl bg-white p-7 shadow-sm">

      <div className="mb-6 flex items-center gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff3eb] text-sm font-bold">
          {number}
        </div>

        <h3 className="text-2xl font-bold">
          {title}
        </h3>

      </div>

      <div className="space-y-6">
        {children}
      </div>

    </section>
  );
}

function ReportGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function ReportField({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-2xl bg-[#f5f5f2] p-5">

      <p className="text-xs font-bold uppercase tracking-wide text-[#66736f]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line font-semibold">
        {value || '—'}
      </p>

    </div>
  );
}

function ReportText({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div>

      <p className="text-sm font-bold">
        {label}
      </p>

      <div className="mt-2 rounded-2xl bg-[#f5f5f2] p-5">

        <p className="whitespace-pre-line leading-7 text-[#4f5f5a]">
          {value || '—'}
        </p>

      </div>

    </div>
  );
}

function ComponentList({
  title,
  components,
}: {
  title: string;
  components: ComponentItem[];
}) {
  return (
    <div>

      <h4 className="font-bold">
        {title}
      </h4>

      <div className="mt-3 space-y-2">

        {components.length === 0 ? (

          <EmptyText />

        ) : (

          components.map((component) => (

            <div
              key={component.id}
              className="flex items-center justify-between rounded-xl bg-[#f5f5f2] px-4 py-3"
            >

              <span className="font-semibold">
                {component.name}
              </span>

              {component.is_target && (

                <span className="rounded-full bg-[#dff3eb] px-3 py-1 text-xs font-bold">
                  TARGET
                </span>

              )}

            </div>

          ))

        )}

      </div>

    </div>
  );
}

function ParameterIds({
  title,
  ids,
}: {
  title: string;
  ids: number[];
}) {
  return (
    <div>

      <p className="text-sm font-bold">
        {title}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">

        {ids.length === 0 ? (

          <span className="text-sm text-[#66736f]">
            —
          </span>

        ) : (

          ids.map((id) => (

            <span
              key={id}
              className="rounded-full bg-[#dff3eb] px-3 py-1.5 text-sm font-bold"
            >
              {String(id).padStart(2, '0')}
            </span>

          ))

        )}

      </div>

    </div>
  );
}

function YesNo({
  label,
  value,
}: {
  label: string;
  value: boolean | null | undefined;
}) {
  let result = 'Not answered';

  if (value === true) result = 'Yes';
  if (value === false) result = 'No';

  return (
    <div className="flex items-center justify-between rounded-xl bg-[#f5f5f2] px-4 py-3">

      <span className="text-sm font-semibold">
        {label}
      </span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          value === true
            ? 'bg-[#dff3eb]'
            : value === false
            ? 'bg-[#ececea]'
            : 'bg-white'
        }`}
      >
        {result}
      </span>

    </div>
  );
}

function DarkInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-xs font-bold uppercase tracking-wide text-white/50">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>

    </div>
  );
}

function EmptyText({
  text = 'No data available.',
}: {
  text?: string;
}) {
  return (
    <p className="rounded-xl border border-dashed border-[#cbd5d1] p-5 text-sm text-[#66736f]">
      {text}
    </p>
  );
}
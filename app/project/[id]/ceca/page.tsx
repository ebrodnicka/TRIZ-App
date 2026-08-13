'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

type ComponentItem = {
  id: string;
  name: string;
};

type FunctionRow = {
  id: string;
  carrier_component_id: string;
  action: string;
  object_component_id: string;
  category: string;
  performance: string;
};

export default function CecaPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [disadvantages, setDisadvantages] = useState<FunctionRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCeca();
  }, [projectId]);

  async function loadCeca() {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      setError('Project could not be found.');
      setLoading(false);
      return;
    }

    setProjectName(project.name);

    const { data: componentData, error: componentError } =
      await supabase
        .from('components')
        .select('id, name')
        .eq('project_id', projectId);

    if (componentError) {
      setError(componentError.message);
      setLoading(false);
      return;
    }

    setComponents(componentData || []);

    const { data: disadvantageData, error: disadvantageError } =
      await supabase
        .from('function_model_rows')
        .select(
          'id, carrier_component_id, action, object_component_id, category, performance'
        )
        .eq('project_id', projectId)
        .eq('is_key_disadvantage', true)
        .order('created_at');

    if (disadvantageError) {
      setError(disadvantageError.message);
      setLoading(false);
      return;
    }

    setDisadvantages(disadvantageData || []);
    setLoading(false);
  }

  function getComponentName(id: string) {
    return (
      components.find((component) => component.id === id)?.name ||
      'Unknown component'
    );
  }

  async function copyDisadvantages() {
    if (disadvantages.length === 0) {
      return;
    }

    const text = disadvantages
      .map(
        (row, index) =>
          `${index + 1}. ${getComponentName(
            row.carrier_component_id
          )} → ${row.action} → ${getComponentName(
            row.object_component_id
          )} | ${row.category} | ${row.performance}`
      )
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError('Could not copy the Key Disadvantages.');
    }
  }

  async function continueToTechnicalContradiction() {
    setContinuing(true);
    setError('');

    const { error: projectError } = await supabase
      .from('projects')
      .update({
        current_step: 'Technical Contradiction',
      })
      .eq('id', projectId);

    if (projectError) {
      setContinuing(false);
      setError(projectError.message);
      return;
    }

    router.push(
      `/project/${projectId}/technical-contradiction`
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">
          Loading CECA...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f2e9] text-[#123d36]">
      <header className="border-b border-[#d8d5ca] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#57b89d]">
              TRIZup
            </p>

            <h1 className="text-xl font-bold">
              TRIZ Innovation Workspace
            </h1>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg border border-[#123d36] px-5 py-2.5 text-sm font-semibold hover:bg-[#edf3f1]"
          >
            My Projects
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-8 py-12">

        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#57b89d]">
            Step 7 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            CECA
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-[#e8f5f1] p-6">
          <h3 className="text-lg font-bold">
            Cause and Effect Chain Analysis
          </h3>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-[#5e706b]">
            Use the Key Disadvantages identified in the Function Model
            as the starting points for your CECA diagram. The diagram
            itself should be prepared in an external diagramming tool.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-2xl font-bold">
                  Key Disadvantages
                </h3>

                <p className="mt-2 text-sm text-[#66736f]">
                  Imported automatically from the Function Model.
                </p>
              </div>

              <button
                type="button"
                onClick={copyDisadvantages}
                disabled={disadvantages.length === 0}
                className="rounded-xl border border-[#123d36] px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? 'Copied ✓' : 'Copy list'}
              </button>
            </div>

            <div className="mt-6 space-y-4">

              {disadvantages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#cbd5d1] p-8 text-center">
                  <p className="font-bold">
                    No Key Disadvantages detected
                  </p>

                  <p className="mt-2 text-sm text-[#66736f]">
                    You can return to the Function Model and classify
                    a function as Harmful, Inefficient or Excessive.
                  </p>
                </div>
              ) : (
                disadvantages.map((row, index) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-[#ead6d3] bg-red-50 p-5"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-bold text-red-700">
                        {index + 1}
                      </div>

                      <div>
                        <p className="font-bold">
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

                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                          {row.category}
                          {' • '}
                          {row.performance}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

          <div className="space-y-6">

            <div className="rounded-3xl bg-[#123d36] p-7 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7ed6bc]">
                CECA Workflow
              </p>

              <ol className="mt-5 space-y-5">
                <Step
                  number="1"
                  text="Copy the Key Disadvantages."
                />

                <Step
                  number="2"
                  text="Create the Cause and Effect Chain in an external tool."
                />

                <Step
                  number="3"
                  text="Identify root causes and important cause-effect relationships."
                />

                <Step
                  number="4"
                  text="Return to TRIZ Innovation Workspace and continue."
                />
              </ol>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm">
              <h3 className="text-lg font-bold">
                Suggested tools
              </h3>

              <p className="mt-2 text-sm text-[#66736f]">
                Open one of the external diagramming tools in a new tab.
              </p>

              <div className="mt-5 grid gap-3">

                <ExternalTool
                  name="diagrams.net"
                  href="https://app.diagrams.net/"
                />

                <ExternalTool
                  name="Miro"
                  href="https://miro.com/"
                />

                <ExternalTool
                  name="Lucidchart"
                  href="https://www.lucidchart.com/"
                />

                <ExternalTool
                  name="XMind"
                  href="https://xmind.app/"
                />

              </div>
            </div>

            <div className="rounded-2xl border border-[#d8d5ca] bg-white p-5">
              <p className="text-sm font-semibold">
                Trimming
              </p>

              <p className="mt-2 text-sm leading-6 text-[#66736f]">
                Trimming is not implemented as a separate module
                in this prototype.
              </p>
            </div>

          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">

          <button
            onClick={() =>
              router.push(
                `/project/${projectId}/function-model`
              )
            }
            className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
          >
            ← Back
          </button>

          <button
            onClick={continueToTechnicalContradiction}
            disabled={continuing}
            className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {continuing
              ? 'Loading...'
              : 'Continue to Technical Contradiction →'}
          </button>

        </div>

      </section>
    </main>
  );
}

function Step({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7ed6bc] font-bold text-[#123d36]">
        {number}
      </div>

      <p className="pt-1 text-sm leading-6 text-white/90">
        {text}
      </p>
    </li>
  );
}

function ExternalTool({
  name,
  href,
}: {
  name: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl border border-[#d8d5ca] px-4 py-3 font-semibold transition hover:bg-[#edf3f1]"
    >
      {name}

      <span>↗</span>
    </a>
  );
}
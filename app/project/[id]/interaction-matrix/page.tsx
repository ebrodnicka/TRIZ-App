'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

type ComponentItem = {
  id: string;
  name: string;
  component_type: 'System' | 'Supersystem';
  is_target: boolean;
  sort_order: number;
};

type InteractionValue = '+' | '-';

type InteractionMap = {
  [key: string]: InteractionValue;
};

export default function InteractionMatrixPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionMap>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMatrix();
  }, [projectId]);

  function pairKey(a: string, b: string) {
    return [a, b].sort().join('__');
  }

  async function loadMatrix() {
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

    const { data: componentData, error: componentError } = await supabase
      .from('components')
      .select('*')
      .eq('project_id', projectId)
      .order('component_type')
      .order('sort_order')
      .order('created_at');

    if (componentError) {
      setError(componentError.message);
      setLoading(false);
      return;
    }

    setComponents(componentData || []);

    const { data: savedInteractions, error: interactionError } =
      await supabase
        .from('interactions')
        .select(
          'component_a_id, component_b_id, interaction'
        )
        .eq('project_id', projectId);

    if (interactionError) {
      setError(interactionError.message);
      setLoading(false);
      return;
    }

    const loadedMap: InteractionMap = {};

    savedInteractions?.forEach((item) => {
      loadedMap[
        pairKey(item.component_a_id, item.component_b_id)
      ] = item.interaction as InteractionValue;
    });

    setInteractions(loadedMap);

    setLoading(false);
  }

  function cycleInteraction(componentA: string, componentB: string) {
    if (componentA === componentB) {
      return;
    }

    const key = pairKey(componentA, componentB);
    const currentValue = interactions[key];

    let nextValue: InteractionValue;

    if (!currentValue) {
      nextValue = '+';
    } else if (currentValue === '+') {
      nextValue = '-';
    } else {
      nextValue = '+';
    }

    setInteractions((previous) => ({
      ...previous,
      [key]: nextValue,
    }));

    setMessage('');
    setError('');
  }

  function getInteraction(componentA: string, componentB: string) {
    if (componentA === componentB) {
      return null;
    }

    return interactions[pairKey(componentA, componentB)];
  }

  const requiredInteractions =
    components.length > 1
      ? (components.length * (components.length - 1)) / 2
      : 0;

  const completedInteractions = Object.keys(interactions).length;

  const matrixComplete =
    requiredInteractions > 0 &&
    completedInteractions === requiredInteractions;

  async function saveMatrix(goNext = false) {
    setError('');
    setMessage('');

    if (components.length < 2) {
      setError(
        'At least two components are required to create an Interaction Matrix.'
      );
      return;
    }

    if (goNext && !matrixComplete) {
      setError(
        'Please define every interaction before continuing.'
      );
      return;
    }

    setSaving(true);

    const { error: deleteError } = await supabase
      .from('interactions')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      setSaving(false);
      setError(deleteError.message);
      return;
    }

    const rows = Object.entries(interactions).map(
      ([key, interaction]) => {
        const [componentA, componentB] = key.split('__');

        return {
          project_id: projectId,
          component_a_id: componentA,
          component_b_id: componentB,
          interaction,
        };
      }
    );

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('interactions')
        .insert(rows);

      if (insertError) {
        setSaving(false);
        setError(insertError.message);
        return;
      }
    }

    if (goNext) {
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          current_step: 'Function Model',
        })
        .eq('id', projectId);

      if (projectError) {
        setSaving(false);
        setError(projectError.message);
        return;
      }

      router.push(`/project/${projectId}/function-model`);
      return;
    }

    setSaving(false);
    setMessage('Interaction Matrix saved successfully.');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">
          Loading Interaction Matrix...
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

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#57b89d]">
            Step 5 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Interaction Matrix
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-[#e8f5f1] p-5">
          <p className="font-semibold">
            Define whether each pair of components interacts.
          </p>

          <p className="mt-2 text-sm leading-6 text-[#5e706b]">
            Click a cell to change its value. A positive interaction
            means the components physically contact or otherwise
            interact. A negative interaction means they do not.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            <span>Empty → +</span>
            <span>+ → −</span>
            <span>− → +</span>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">
              Matrix completion
            </p>

            <p className="mt-1 text-sm text-[#66736f]">
              {completedInteractions} of {requiredInteractions}{' '}
              interactions defined
            </p>
          </div>

          <div
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              matrixComplete
                ? 'bg-[#dff3eb] text-[#123d36]'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {matrixComplete ? 'Complete' : 'Incomplete'}
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white p-5 shadow-sm">
          {components.length < 2 ? (
            <div className="p-10 text-center">
              <p className="font-bold">
                Not enough components
              </p>

              <p className="mt-2 text-[#66736f]">
                Add at least two components before creating the
                Interaction Matrix.
              </p>
            </div>
          ) : (
            <table className="min-w-max border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-[180px] bg-white p-3 text-left">
                    Component
                  </th>

                  {components.map((component) => (
                    <th
                      key={component.id}
                      className="min-w-[110px] max-w-[140px] p-3 text-center align-bottom"
                    >
                      <div className="break-words text-sm font-bold">
                        {component.name}
                      </div>

                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#7a8682]">
                        {component.component_type}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {components.map((rowComponent) => (
                  <tr key={rowComponent.id}>
                    <th className="sticky left-0 z-10 min-w-[180px] rounded-lg bg-[#f5f5f2] p-3 text-left">
                      <div className="font-semibold">
                        {rowComponent.name}
                      </div>

                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#7a8682]">
                        {rowComponent.component_type}
                      </div>
                    </th>

                    {components.map((columnComponent) => {
                      const diagonal =
                        rowComponent.id === columnComponent.id;

                      const value = getInteraction(
                        rowComponent.id,
                        columnComponent.id
                      );

                      return (
                        <td
                          key={columnComponent.id}
                          className="p-0.5 text-center"
                        >
                          {diagonal ? (
                            <div className="flex h-14 w-full min-w-[90px] items-center justify-center rounded-lg bg-[#e3e3de] font-bold text-[#8a9692]">
                              —
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                cycleInteraction(
                                  rowComponent.id,
                                  columnComponent.id
                                )
                              }
                              className={`flex h-14 w-full min-w-[90px] items-center justify-center rounded-lg border text-xl font-bold transition ${
                                value === '+'
                                  ? 'border-[#57b89d] bg-[#dff3eb] text-[#123d36]'
                                  : value === '-'
                                  ? 'border-[#d8d5ca] bg-[#ececea] text-[#48534f]'
                                  : 'border-red-200 bg-red-50 text-red-300 hover:bg-red-100'
                              }`}
                            >
                              {value || ''}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-5 rounded-xl bg-white px-5 py-4 text-sm text-[#66736f]">
          <span className="font-bold text-[#123d36]">+</span>
          {' '}Interaction exists
          <span className="mx-3">•</span>
          <span className="font-bold text-[#123d36]">−</span>
          {' '}No interaction
          <span className="mx-3">•</span>
          Red cells still require an answer
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
          <button
            onClick={() =>
              router.push(`/project/${projectId}/components`)
            }
            className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
          >
            ← Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => saveMatrix(false)}
              disabled={saving}
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={() => saveMatrix(true)}
              disabled={saving || !matrixComplete}
              className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
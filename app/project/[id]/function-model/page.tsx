'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

type ComponentItem = {
  id: string;
  name: string;
  component_type: 'System' | 'Supersystem';
};

type InteractionItem = {
  component_a_id: string;
  component_b_id: string;
  interaction: '+' | '-';
};

type FunctionRow = {
  id: string;
  carrier_component_id: string;
  action: string;
  object_component_id: string;
  category: 'Useful' | 'Harmful';
  performance: 'Normal' | 'Inefficient' | 'Excessive';
  function_rank:
    | 'Basic'
    | 'Additional'
    | 'Auxiliary'
    | 'Not applicable';
  score: number;
  is_key_disadvantage: boolean;
};

type Category = 'Useful' | 'Harmful';

type Performance =
  | 'Normal'
  | 'Inefficient'
  | 'Excessive';

type Rank =
  | 'Basic'
  | 'Additional'
  | 'Auxiliary'
  | 'Not applicable';

export default function FunctionModelPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');

  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [rows, setRows] = useState<FunctionRow[]>([]);

  const [carrierId, setCarrierId] = useState('');
  const [action, setAction] = useState('');
  const [objectId, setObjectId] = useState('');

  const [category, setCategory] =
    useState<Category>('Useful');

  const [performance, setPerformance] =
    useState<Performance>('Normal');

  const [rank, setRank] =
    useState<Rank>('Basic');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadFunctionModel();
  }, [projectId]);

  async function loadFunctionModel() {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: project, error: projectError } =
      await supabase
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
        .select('id, name, component_type')
        .eq('project_id', projectId)
        .order('component_type')
        .order('sort_order');

    if (componentError) {
      setError(componentError.message);
      setLoading(false);
      return;
    }

    setComponents(componentData || []);

    const {
      data: interactionData,
      error: interactionError,
    } = await supabase
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

    setInteractions(interactionData || []);

    await refreshFunctionRows();

    setLoading(false);
  }

  async function refreshFunctionRows() {
    const { data, error: rowError } = await supabase
      .from('function_model_rows')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (rowError) {
      setError(rowError.message);
      return;
    }

    setRows(data || []);
  }

  const availableObjects = useMemo(() => {
    if (!carrierId) {
      return [];
    }

    const positiveIds = new Set<string>();

    interactions.forEach((interaction) => {
      if (interaction.interaction !== '+') {
        return;
      }

      if (interaction.component_a_id === carrierId) {
        positiveIds.add(interaction.component_b_id);
      }

      if (interaction.component_b_id === carrierId) {
        positiveIds.add(interaction.component_a_id);
      }
    });

    return components.filter(
      (component) =>
        positiveIds.has(component.id) &&
        component.id !== carrierId
    );
  }, [carrierId, interactions, components]);

  useEffect(() => {
    if (
      objectId &&
      !availableObjects.some(
        (component) => component.id === objectId
      )
    ) {
      setObjectId('');
    }
  }, [carrierId, availableObjects, objectId]);

  function calculateScore(selectedRank: Rank) {
    switch (selectedRank) {
      case 'Basic':
        return 3;
      case 'Additional':
        return 2;
      case 'Auxiliary':
        return 1;
      case 'Not applicable':
        return 0;
      default:
        return 0;
    }
  }

  function getComponentName(id: string) {
    return (
      components.find(
        (component) => component.id === id
      )?.name || 'Unknown'
    );
  }

  async function addFunction() {
    setError('');
    setMessage('');

    if (!carrierId) {
      setError('Please select a Function Carrier.');
      return;
    }

    if (!action.trim()) {
      setError('Please enter an Action.');
      return;
    }

    if (!objectId) {
      setError(
        'Please select an Object with a positive interaction.'
      );
      return;
    }

    if (carrierId === objectId) {
      setError(
        'Function Carrier and Object cannot be the same component.'
      );
      return;
    }

    const validPositiveInteraction =
      availableObjects.some(
        (component) => component.id === objectId
      );

    if (!validPositiveInteraction) {
      setError(
        'The selected Carrier and Object must have a positive interaction.'
      );
      return;
    }

    const isKeyDisadvantage =
      category === 'Harmful' ||
      performance === 'Inefficient' ||
      performance === 'Excessive';

    const { error: insertError } = await supabase
      .from('function_model_rows')
      .insert({
        project_id: projectId,
        carrier_component_id: carrierId,
        action: action.trim(),
        object_component_id: objectId,
        category,
        performance,
        function_rank: rank,
        is_key_disadvantage: isKeyDisadvantage,
      });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setCarrierId('');
    setAction('');
    setObjectId('');
    setCategory('Useful');
    setPerformance('Normal');
    setRank('Basic');

    await refreshFunctionRows();
  }

  async function removeFunction(id: string) {
    setError('');
    setMessage('');

    const { error: deleteError } = await supabase
      .from('function_model_rows')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await refreshFunctionRows();
  }

  async function saveFunctionModel(goNext = false) {
    setError('');
    setMessage('');

    if (rows.length === 0) {
      setError(
        'Please add at least one function before continuing.'
      );
      return;
    }

    setSaving(true);

    if (goNext) {
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          current_step: 'CECA',
        })
        .eq('id', projectId);

      if (projectError) {
        setSaving(false);
        setError(projectError.message);
        return;
      }

      router.push(`/project/${projectId}/ceca`);
      return;
    }

    setSaving(false);
    setMessage('Function Model saved successfully.');
  }

  const componentSummary = useMemo(() => {
    return components
      .map((component) => {
        const score = rows
          .filter(
            (row) =>
              row.carrier_component_id === component.id
          )
          .reduce(
            (total, row) => total + Number(row.score || 0),
            0
          );

        return {
          component,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [components, rows]);

  const keyDisadvantages = rows.filter(
    (row) => row.is_key_disadvantage
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">
          Loading Function Model...
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
            Step 6 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Function Model
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-[#e8f5f1] p-5">
          <p className="font-semibold">
            Define the functions performed between interacting components.
          </p>

          <p className="mt-2 text-sm leading-6 text-[#5e706b]">
            The Object list is automatically filtered using
            positive interactions from the Interaction Matrix.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-sm">

          <h3 className="text-2xl font-bold">
            Add Function
          </h3>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">

            <SelectField
              label="Function Carrier"
              value={carrierId}
              onChange={setCarrierId}
            >
              <option value="">
                Select component
              </option>

              {components.map((component) => (
                <option
                  key={component.id}
                  value={component.id}
                >
                  {component.name}
                </option>
              ))}
            </SelectField>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Action
              </label>

              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="e.g. Moves"
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
              />
            </div>

            <SelectField
              label="Object"
              value={objectId}
              onChange={setObjectId}
            >
              <option value="">
                {carrierId
                  ? 'Select interacting component'
                  : 'Select Carrier first'}
              </option>

              {availableObjects.map((component) => (
                <option
                  key={component.id}
                  value={component.id}
                >
                  {component.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Category"
              value={category}
              onChange={(value) =>
                setCategory(value as Category)
              }
            >
              <option value="Useful">Useful</option>
              <option value="Harmful">Harmful</option>
            </SelectField>

            <SelectField
              label="Performance"
              value={performance}
              onChange={(value) =>
                setPerformance(value as Performance)
              }
            >
              <option value="Normal">Normal</option>
              <option value="Inefficient">
                Inefficient
              </option>
              <option value="Excessive">
                Excessive
              </option>
            </SelectField>

            <SelectField
              label="Rank"
              value={rank}
              onChange={(value) =>
                setRank(value as Rank)
              }
            >
              <option value="Basic">
                Basic — 3
              </option>
              <option value="Additional">
                Additional — 2
              </option>
              <option value="Auxiliary">
                Auxiliary — 1
              </option>
              <option value="Not applicable">
                Not applicable — 0
              </option>
            </SelectField>

          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={addFunction}
              className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white"
            >
              + Add Function
            </button>
          </div>
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

        <div className="mt-8 overflow-x-auto rounded-3xl bg-white p-5 shadow-sm">

          <h3 className="mb-5 text-2xl font-bold">
            Functions
          </h3>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#cbd5d1] p-8 text-center text-[#66736f]">
              No functions added yet.
            </div>
          ) : (
            <table className="min-w-[1000px] w-full text-left">
              <thead>
                <tr className="border-b border-[#d8d5ca] text-sm">
                  <th className="p-3">Carrier</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Object</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Performance</th>
                  <th className="p-3">Rank</th>
                  <th className="p-3 text-center">
                    Score
                  </th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
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

                    <td className="p-3 text-center text-lg font-bold">
                      {row.score}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          removeFunction(row.id)
                        }
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">
              Component Summary
            </h3>

            <p className="mt-2 text-sm text-[#66736f]">
              Total Rank Score for functions where the
              component acts as Function Carrier.
            </p>

            <div className="mt-5 space-y-3">
              {componentSummary.length === 0 ? (
                <p className="text-sm text-[#66736f]">
                  No scores available yet.
                </p>
              ) : (
                componentSummary.map((item) => (
                  <div
                    key={item.component.id}
                    className="flex items-center justify-between rounded-xl border border-[#d8d5ca] px-4 py-3"
                  >
                    <span className="font-semibold">
                      {item.component.name}
                    </span>

                    <span className="rounded-full bg-[#dff3eb] px-3 py-1 font-bold">
                      {item.score}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">
              Key Disadvantages
            </h3>

            <p className="mt-2 text-sm text-[#66736f]">
              Harmful, inefficient or excessive functions
              detected in the Function Model.
            </p>

            <div className="mt-5 space-y-3">
              {keyDisadvantages.length === 0 ? (
                <p className="text-sm text-[#66736f]">
                  No disadvantages detected yet.
                </p>
              ) : (
                keyDisadvantages.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-[#ead6d3] bg-red-50 p-4"
                  >
                    <p className="font-semibold">
                      {getComponentName(
                        row.carrier_component_id
                      )}{' '}
                      → {row.action} →{' '}
                      {getComponentName(
                        row.object_component_id
                      )}
                    </p>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                      {row.category} • {row.performance}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">

          <button
            onClick={() =>
              router.push(
                `/project/${projectId}/interaction-matrix`
              )
            }
            className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
          >
            ← Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              onClick={() =>
                saveFunctionModel(false)
              }
              disabled={saving}
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={() =>
                saveFunctionModel(true)
              }
              disabled={saving || rows.length === 0}
              className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? 'Saving...'
                : 'Save & Continue →'}
            </button>

          </div>
        </div>

      </section>
    </main>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#cbd5d1] bg-white px-4 py-3 outline-none focus:border-[#57b89d]"
      >
        {children}
      </select>
    </div>
  );
}
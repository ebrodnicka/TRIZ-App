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

export default function ComponentsPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');
  const [components, setComponents] = useState<ComponentItem[]>([]);

  const [systemName, setSystemName] = useState('');
  const [supersystemName, setSupersystemName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadComponents();
  }, [projectId]);

  async function loadComponents() {
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

    const { data: engineeringSystem } = await supabase
      .from('engineering_systems')
      .select('target')
      .eq('project_id', projectId)
      .maybeSingle();

    const target = engineeringSystem?.target?.trim();

    if (target) {
      const { data: existingTarget } = await supabase
        .from('components')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_target', true)
        .maybeSingle();

      if (!existingTarget) {
        await supabase.from('components').insert({
          project_id: projectId,
          name: target,
          component_type: 'Supersystem',
          is_target: true,
          sort_order: 0,
        });
      } else if (existingTarget.name !== target) {
        await supabase
          .from('components')
          .update({
            name: target,
            component_type: 'Supersystem',
          })
          .eq('id', existingTarget.id);
      }
    }

    await refreshComponents();
    setLoading(false);
  }

  async function refreshComponents() {
    const { data, error: componentsError } = await supabase
      .from('components')
      .select('*')
      .eq('project_id', projectId)
      .order('component_type')
      .order('sort_order')
      .order('created_at');

    if (componentsError) {
      setError(componentsError.message);
      return;
    }

    setComponents(data || []);
  }

  function componentExists(name: string) {
    return components.some(
      (component) =>
        component.name.trim().toLowerCase() ===
        name.trim().toLowerCase()
    );
  }

  async function addComponent(
    name: string,
    type: 'System' | 'Supersystem'
  ) {
    setError('');
    setMessage('');

    const cleanName = name.trim();

    if (!cleanName) {
      setError('Please enter a component name.');
      return;
    }

    if (componentExists(cleanName)) {
      setError('A component with this name already exists.');
      return;
    }

    const currentTypeCount = components.filter(
      (component) => component.component_type === type
    ).length;

    const { error: insertError } = await supabase
      .from('components')
      .insert({
        project_id: projectId,
        name: cleanName,
        component_type: type,
        is_target: false,
        sort_order: currentTypeCount + 1,
      });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (type === 'System') {
      setSystemName('');
    } else {
      setSupersystemName('');
    }

    await refreshComponents();
  }

  async function removeComponent(component: ComponentItem) {
    if (component.is_target) {
      setError(
        'The Target component is generated automatically and cannot be removed here.'
      );
      return;
    }

    setError('');
    setMessage('');

    const { error: deleteError } = await supabase
      .from('components')
      .delete()
      .eq('id', component.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await refreshComponents();
  }

  async function saveComponents(goNext = false) {
    setError('');
    setMessage('');

    const systemComponents = components.filter(
      (component) => component.component_type === 'System'
    );

    if (systemComponents.length < 1) {
      setError(
        'Please add at least one System component before continuing.'
      );
      return;
    }

    setSaving(true);

    if (goNext) {
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          current_step: 'Interaction Matrix',
        })
        .eq('id', projectId);

      if (projectError) {
        setSaving(false);
        setError(projectError.message);
        return;
      }

      router.push(`/project/${projectId}/interaction-matrix`);
      return;
    }

    setSaving(false);
    setMessage('Components saved successfully.');
  }

  const systemComponents = components.filter(
    (component) => component.component_type === 'System'
  );

  const supersystemComponents = components.filter(
    (component) => component.component_type === 'Supersystem'
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">Loading Components...</p>
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
            Step 4 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            System & Supersystem Components
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-[#e8f5f1] p-5">
          <p className="font-semibold">
            Define the components participating in the Engineering System.
          </p>

          <p className="mt-2 text-sm leading-6 text-[#5e706b]">
            The Target from the Engineering System is automatically added
            as a Supersystem component.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <ComponentSection
            title="System Components"
            description="Components located inside the Engineering System."
            components={systemComponents}
            inputValue={systemName}
            setInputValue={setSystemName}
            onAdd={() => addComponent(systemName, 'System')}
            onRemove={removeComponent}
          />

          <ComponentSection
            title="Supersystem Components"
            description="External components interacting with the Engineering System."
            components={supersystemComponents}
            inputValue={supersystemName}
            setInputValue={setSupersystemName}
            onAdd={() =>
              addComponent(supersystemName, 'Supersystem')
            }
            onRemove={removeComponent}
          />
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
              router.push(`/project/${projectId}/s-curve`)
            }
            className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
          >
            ← Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => saveComponents(false)}
              disabled={saving}
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={() => saveComponents(true)}
              disabled={saving}
              className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ComponentSection({
  title,
  description,
  components,
  inputValue,
  setInputValue,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  components: ComponentItem[];
  inputValue: string;
  setInputValue: (value: string) => void;
  onAdd: () => void;
  onRemove: (component: ComponentItem) => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-7 shadow-sm">
      <h3 className="text-2xl font-bold">{title}</h3>

      <p className="mt-2 text-sm text-[#66736f]">
        {description}
      </p>

      <div className="mt-6 flex gap-3">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd();
            }
          }}
          placeholder="Component name"
          className="min-w-0 flex-1 rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
        />

        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl bg-[#123d36] px-5 py-3 font-semibold text-white"
        >
          + Add
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {components.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#cbd5d1] p-5 text-center text-sm text-[#66736f]">
            No components added yet.
          </div>
        ) : (
          components.map((component) => (
            <div
              key={component.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#d8d5ca] px-4 py-3"
            >
              <div>
                <p className="font-semibold">{component.name}</p>

                {component.is_target && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#57b89d]">
                    Target
                  </p>
                )}
              </div>

              {component.is_target ? (
                <span className="rounded-full bg-[#dff3eb] px-3 py-1 text-xs font-semibold">
                  Auto
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onRemove(component)}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
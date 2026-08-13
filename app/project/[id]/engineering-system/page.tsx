'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function EngineeringSystemPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');
  const [systemName, setSystemName] = useState('');
  const [mainFunction, setMainFunction] = useState('');
  const [action, setAction] = useState('');
  const [target, setTarget] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadEngineeringSystem();
  }, [projectId]);

  async function loadEngineeringSystem() {
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
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (engineeringSystem) {
      setSystemName(engineeringSystem.system_name || '');
      setMainFunction(engineeringSystem.main_function || '');
      setAction(engineeringSystem.action || '');
      setTarget(engineeringSystem.target || '');
    }

    setLoading(false);
  }

  async function saveEngineeringSystem(goNext = false) {
    setError('');
    setMessage('');

    if (
      !systemName.trim() ||
      !mainFunction.trim() ||
      !action.trim() ||
      !target.trim()
    ) {
      setError('Please complete all fields before continuing.');
      return;
    }

    setSaving(true);

    const { error: saveError } = await supabase
      .from('engineering_systems')
      .upsert(
        {
          project_id: projectId,
          system_name: systemName.trim(),
          main_function: mainFunction.trim(),
          action: action.trim(),
          target: target.trim(),
        },
        {
          onConflict: 'project_id',
        }
      );

    if (saveError) {
      setSaving(false);
      setError(saveError.message);
      return;
    }

    if (goNext) {
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          current_step: 'S-Curve',
        })
        .eq('id', projectId);

      if (projectError) {
        setSaving(false);
        setError(projectError.message);
        return;
      }

      router.push(`/project/${projectId}/s-curve`);
      return;
    }

    setSaving(false);
    setMessage('Engineering System saved successfully.');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">
          Loading Engineering System...
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

      <section className="mx-auto max-w-5xl px-8 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#57b89d]">
            Step 2 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Engineering System
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-8 rounded-2xl bg-[#e8f5f1] p-5">
            <p className="font-semibold">
              Define the engineering system and its main function.
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5e706b]">
              The Action describes what the system does, while the Target
              identifies the object affected by that action.
            </p>
          </div>

          <div className="space-y-6">
            <InputField
              label="System Name"
              placeholder="e.g. Headphones"
              value={systemName}
              onChange={setSystemName}
            />

            <InputField
              label="Main Function"
              placeholder="e.g. Move air"
              value={mainFunction}
              onChange={setMainFunction}
            />

            <InputField
              label="Action"
              placeholder="e.g. Move"
              value={action}
              onChange={setAction}
            />

            <InputField
              label="Target"
              placeholder="e.g. Air"
              value={target}
              onChange={setTarget}
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
                router.push(`/project/${projectId}/charter`)
              }
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
            >
              ← Back
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => saveEngineeringSystem(false)}
                disabled={saving}
                className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>

              <button
                onClick={() => saveEngineeringSystem(true)}
                disabled={saving}
                className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
      />
    </div>
  );
}
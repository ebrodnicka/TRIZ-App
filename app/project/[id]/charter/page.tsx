'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function ProjectCharterPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');
  const [projectDate, setProjectDate] = useState('');
  const [version, setVersion] = useState('1.0');
  const [businessCase, setBusinessCase] = useState('');
  const [scopeIn, setScopeIn] = useState('');
  const [scopeOut, setScopeOut] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [roles, setRoles] = useState('');
  const [goalsKpis, setGoalsKpis] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
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

    const { data: charter } = await supabase
      .from('project_charters')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (charter) {
      setProjectDate(charter.project_date || '');
      setVersion(charter.version || '1.0');
      setBusinessCase(charter.business_case || '');
      setScopeIn(charter.scope_in || '');
      setScopeOut(charter.scope_out || '');
      setProblemStatement(charter.problem_statement || '');
      setRoles(charter.roles || '');
      setGoalsKpis(charter.goals_kpis || '');
    } else {
      setProjectDate(new Date().toISOString().split('T')[0]);
    }

    setLoading(false);
  }

  async function saveCharter(goNext = false) {
    setSaving(true);
    setError('');
    setMessage('');

    const { error: saveError } = await supabase
      .from('project_charters')
      .upsert(
        {
          project_id: projectId,
          project_date: projectDate || null,
          version,
          business_case: businessCase,
          scope_in: scopeIn,
          scope_out: scopeOut,
          problem_statement: problemStatement,
          roles,
          goals_kpis: goalsKpis,
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
          current_step: 'Engineering System',
        })
        .eq('id', projectId);

      if (projectError) {
        setSaving(false);
        setError(projectError.message);
        return;
      }

      router.push(`/project/${projectId}/engineering-system`);
      return;
    }

    setSaving(false);
    setMessage('Project Charter saved successfully.');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">Loading Project Charter...</p>
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
            Step 1 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Project Charter
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Project Name
              </label>

              <input
                value={projectName}
                disabled
                className="w-full rounded-xl border border-[#d8d5ca] bg-[#f5f5f2] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Date
              </label>

              <input
                type="date"
                value={projectDate}
                onChange={(e) => setProjectDate(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Version
              </label>

              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3"
              />
            </div>

            <Field
              label="Business Case"
              value={businessCase}
              onChange={setBusinessCase}
            />

            <Field
              label="Problem Statement"
              value={problemStatement}
              onChange={setProblemStatement}
            />

            <Field
              label="Scope IN"
              value={scopeIn}
              onChange={setScopeIn}
            />

            <Field
              label="Scope OUT"
              value={scopeOut}
              onChange={setScopeOut}
            />

            <Field
              label="Roles"
              value={roles}
              onChange={setRoles}
            />

            <Field
              label="Goals / KPIs"
              value={goalsKpis}
              onChange={setGoalsKpis}
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

          <div className="mt-8 flex flex-col justify-end gap-3 sm:flex-row">

            <button
              onClick={() => saveCharter(false)}
              disabled={saving}
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold text-[#123d36] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={() => saveCharter(true)}
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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full resize-none rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
      />
    </div>
  );
}
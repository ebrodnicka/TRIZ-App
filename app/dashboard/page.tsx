'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

type Project = {
  id: string;
  name: string;
  status: string;
  current_step: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || '');
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status, current_step, created_at')
      .order('created_at', { ascending: false });

    if (projectError) {
      setError(projectError.message);
    } else {
      setProjects(projectData || []);
    }

    setLoading(false);
  }

  async function createProject() {
    if (!projectName.trim()) {
      setError('Please enter a project name.');
      return;
    }

    setCreating(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error: createError } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        name: projectName.trim(),
        status: 'Draft',
        current_step: 'Project Charter',
      })
      .select()
      .single();

    setCreating(false);

    if (createError) {
      setError(createError.message);
      return;
    }

    setProjectName('');

    if (data) {
      setProjects((previous) => [data, ...previous]);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">Loading your workspace...</p>
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
            <h1 className="text-xl font-bold">TRIZ Innovation Workspace</h1>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-[#123d36] px-5 py-2.5 text-sm font-semibold hover:bg-[#edf3f1]"
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold text-[#57b89d]">
            USER PANEL
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            {fullName ? `Welcome, ${fullName}` : 'My Projects'}
          </h2>

          <p className="mt-3 text-[#66736f]">
            Create a new TRIZ project or continue working on an existing one.
          </p>
        </div>

        <div className="mb-10 rounded-2xl bg-[#123d36] p-6 text-white">
          <h3 className="text-xl font-bold">Start a new project</h3>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="flex-1 rounded-xl bg-white px-4 py-3 text-[#123d36] outline-none"
            />

            <button
              onClick={createProject}
              disabled={creating}
              className="rounded-xl bg-[#7ed6bc] px-6 py-3 font-bold text-[#123d36] disabled:opacity-50"
            >
              {creating ? 'Creating...' : '+ New Project'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-2xl font-bold">My Projects</h3>

            <span className="text-sm text-[#66736f]">
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#b9c5c1] bg-white p-10 text-center">
              <h4 className="text-lg font-bold">No projects yet</h4>

              <p className="mt-2 text-[#66736f]">
                Create your first TRIZ project above.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <h4 className="text-xl font-bold">
                      {project.name}
                    </h4>

                    <span className="rounded-full bg-[#dff3eb] px-3 py-1 text-xs font-semibold">
                      {project.status}
                    </span>
                  </div>

                  <p className="text-sm text-[#66736f]">
                    Current step
                  </p>

                  <p className="mt-1 font-semibold">
                    {project.current_step}
                  </p>

                  <p className="mt-5 text-xs text-[#8a9692]">
                    Created{' '}
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => router.push(`/project/${project.id}/charter`)}
                    className="mt-6 w-full rounded-xl border border-[#123d36] px-4 py-2.5 font-semibold hover:bg-[#edf3f1]"
                  >
                    Open Project
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
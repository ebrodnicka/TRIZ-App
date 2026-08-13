'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

type Answer = 'Yes' | 'No' | 'Not sure' | '';

export default function SCurvePage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');
  const [developmentParameter, setDevelopmentParameter] = useState('');

  const [q1, setQ1] = useState<Answer>('');
  const [q2, setQ2] = useState<Answer>('');
  const [q3, setQ3] = useState<Answer>('');

  const [currentStage, setCurrentStage] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSCurve();
  }, [projectId]);

  useEffect(() => {
    calculateStage();
  }, [q1, q2, q3]);

  async function loadSCurve() {
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

    const { data: curve } = await supabase
      .from('s_curve')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (curve) {
      setDevelopmentParameter(
        curve.main_development_parameter || ''
      );
      setQ1(curve.q1_market_exists || '');
      setQ2(curve.q2_many_variations || '');
      setQ3(
        curve.q3_variations_significantly_different || ''
      );
      setCurrentStage(curve.current_stage || '');
      setRecommendation(curve.recommendation || '');
    }

    setLoading(false);
  }

  function calculateStage() {
    let stage = '';
    let rec = '';

    if (!q1 || !q2 || !q3) {
      setCurrentStage('');
      setRecommendation('');
      return;
    }

    if (
      q1 === 'No' ||
      (q1 === 'Not sure' && q2 === 'No')
    ) {
      stage = '1st Stage – Initial';
      rec =
        'Focus on validating the engineering system, its key functionality and the main development parameter.';
    } else if (
      q1 === 'Yes' &&
      q2 === 'Yes' &&
      q3 === 'No'
    ) {
      stage = '2nd Stage – Growth';
      rec =
        'Focus on improving performance, resolving technical contradictions and developing the system rapidly.';
    } else if (
      q1 === 'Yes' &&
      q2 === 'Yes' &&
      q3 === 'Yes'
    ) {
      stage = '3rd Stage – Maturity';
      rec =
        'Focus on optimisation, efficiency and more advanced contradictions. Consider potential transition to a supersystem.';
    } else if (
      q1 === 'Yes' &&
      q2 === 'No' &&
      q3 === 'Yes'
    ) {
      stage = '4th Stage – Decline / Supersystem Transition';
      rec =
        'Consider whether further development should occur through transition to a supersystem or a fundamentally different solution.';
    } else if (
      q1 === 'Yes' &&
      q2 === 'No'
    ) {
      stage = 'Transitional Stage';
      rec =
        'The system exists on the market but variation is still limited. Continue analysing development opportunities.';
    } else {
      stage = 'Classification requires further analysis';
      rec =
        'The selected answers do not map clearly to one standard S-Curve stage. Review the answers and engineering context.';
    }

    setCurrentStage(stage);
    setRecommendation(rec);
  }

  async function saveSCurve(goNext = false) {
    setError('');
    setMessage('');

    if (!developmentParameter.trim()) {
      setError(
        'Please enter the Main Development Parameter.'
      );
      return;
    }

    if (!q1 || !q2 || !q3) {
      setError(
        'Please answer all three S-Curve questions.'
      );
      return;
    }

    setSaving(true);

    const { error: saveError } = await supabase
      .from('s_curve')
      .upsert(
        {
          project_id: projectId,
          main_development_parameter:
            developmentParameter.trim(),

          q1_market_exists: q1,
          q2_many_variations: q2,
          q3_variations_significantly_different: q3,

          current_stage: currentStage,
          recommendation,
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
          current_step: 'Components',
        })
        .eq('id', projectId);

      if (projectError) {
        setSaving(false);
        setError(projectError.message);
        return;
      }

      router.push(`/project/${projectId}/components`);
      return;
    }

    setSaving(false);
    setMessage('S-Curve analysis saved successfully.');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">
          Loading S-Curve Analysis...
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
            Step 3 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            S-Curve Analysis
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">

          <div className="mb-8">
            <label className="mb-2 block text-sm font-semibold">
              Main Development Parameter
            </label>

            <input
              value={developmentParameter}
              onChange={(e) =>
                setDevelopmentParameter(e.target.value)
              }
              placeholder="e.g. Sound volume"
              className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
            />

            <p className="mt-2 text-sm text-[#66736f]">
              Define the main parameter that describes the development
              of the engineering system.
            </p>
          </div>

          <div className="space-y-6">
            <Question
              number="1"
              question="Does the Engineering System exist on the market?"
              value={q1}
              onChange={setQ1}
            />

            <Question
              number="2"
              question="Are there many variations of the Engineering System?"
              value={q2}
              onChange={setQ2}
            />

            <Question
              number="3"
              question="Are the variations significantly different?"
              value={q3}
              onChange={setQ3}
            />
          </div>

          {currentStage && (
            <div className="mt-8 rounded-2xl bg-[#123d36] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7ed6bc]">
                Current S-Curve Stage
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                {currentStage}
              </h3>

              <p className="mt-4 leading-7 text-white/80">
                {recommendation}
              </p>
            </div>
          )}

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
                router.push(
                  `/project/${projectId}/engineering-system`
                )
              }
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
            >
              ← Back
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => saveSCurve(false)}
                disabled={saving}
                className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>

              <button
                onClick={() => saveSCurve(true)}
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

function Question({
  number,
  question,
  value,
  onChange,
}: {
  number: string;
  question: string;
  value: Answer;
  onChange: (value: Answer) => void;
}) {
  const answers: Answer[] = [
    'Yes',
    'No',
    'Not sure',
  ];

  return (
    <div className="rounded-2xl border border-[#d8d5ca] p-6">
      <div className="flex gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dff3eb] font-bold">
          {number}
        </div>

        <div className="flex-1">
          <p className="font-semibold">
            {question}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            {answers.map((answer) => (
              <button
                key={answer}
                type="button"
                onClick={() => onChange(answer)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
                  value === answer
                    ? 'border-[#123d36] bg-[#123d36] text-white'
                    : 'border-[#cbd5d1] bg-white hover:bg-[#edf3f1]'
                }`}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
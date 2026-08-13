'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

type Parameter = {
  id: number;
  name: string;
};

type Principle = {
  id: number;
  name: string;
  description: string;
};

/* =========================================================
   39 STANDARD TRIZ ENGINEERING PARAMETERS
   ========================================================= */

const ENGINEERING_PARAMETERS: Parameter[] = [
  { id: 1, name: 'Weight of moving object' },
  { id: 2, name: 'Weight of stationary object' },
  { id: 3, name: 'Length of moving object' },
  { id: 4, name: 'Length of stationary object' },
  { id: 5, name: 'Area of moving object' },
  { id: 6, name: 'Area of stationary object' },
  { id: 7, name: 'Volume of moving object' },
  { id: 8, name: 'Volume of stationary object' },
  { id: 9, name: 'Speed' },
  { id: 10, name: 'Force' },
  { id: 11, name: 'Stress, pressure' },
  { id: 12, name: 'Shape' },
  { id: 13, name: "Stability of the object's structure" },
  { id: 14, name: 'Strength' },
  { id: 15, name: 'Duration of action of moving object' },
  { id: 16, name: 'Duration of action of stationary object' },
  { id: 17, name: 'Temperature' },
  { id: 18, name: 'Brightness (radiation intensity)' },
  { id: 19, name: 'Energy spent by moving object' },
  { id: 20, name: 'Energy spent by stationary object' },
  { id: 21, name: 'Power' },
  { id: 22, name: 'Loss of energy' },
  { id: 23, name: 'Loss of substance' },
  { id: 24, name: 'Loss of information' },
  { id: 25, name: 'Loss of time' },
  { id: 26, name: 'Amount of substance' },
  { id: 27, name: 'Reliability' },
  { id: 28, name: 'Measurement accuracy' },
  { id: 29, name: 'Manufacturing accuracy' },
  { id: 30, name: 'Harmful factors acting on object' },
  { id: 31, name: 'Harmful side effects of the object' },
  { id: 32, name: 'Ease of manufacture' },
  { id: 33, name: 'Ease of operation' },
  { id: 34, name: 'Ease of repair' },
  { id: 35, name: 'Adaptability, versatility' },
  { id: 36, name: 'Complexity of device' },
  { id: 37, name: 'Complexity of control and measurement' },
  { id: 38, name: 'Degree of automation' },
  { id: 39, name: 'Productivity' },
];

/* =========================================================
   40 TRIZ INVENTIVE PRINCIPLES
   ========================================================= */

const INVENTIVE_PRINCIPLES: Principle[] = [
  {
    id: 1,
    name: 'Segmentation',
    description:
      'a. Divide an object into independent parts.\n' +
      'b. Make an object easy to disassemble or assemble.\n' +
      'c. Increase the degree of segmentation of an object.',
  },
  {
    id: 2,
    name: 'Taking Out',
    description:
      'Separate an interfering part or property from an object, or extract only the necessary part or property of an object.',
  },
  {
    id: 3,
    name: 'Local Quality',
    description:
      'a. Change the structure of an object or its external environment from uniform to nonuniform.\n' +
      'b. Each part of an object should function under the most suitable conditions for it.\n' +
      'c. Each part of an object should perform a different useful function.',
  },
  {
    id: 4,
    name: 'Asymmetry',
    description:
      'a. Change the shape of an object from symmetrical to asymmetrical.\n' +
      'b. If an object is already asymmetrical, increase its degree of asymmetry.',
  },
  {
    id: 5,
    name: 'Merging',
    description:
      'a. Combine similar or identical objects.\n' +
      'b. Combine objects performing similar operations.\n' +
      'c. Combine similar or adjacent operations in time.',
  },
  {
    id: 6,
    name: 'Universality',
    description:
      'An object or its parts should perform multiple functions.',
  },
  {
    id: 7,
    name: 'Nested Doll',
    description:
      'a. Place one object inside another, then place that combination inside another, and so on.\n' +
      'b. Parts should move in the spaces between other objects.',
  },
  {
    id: 8,
    name: 'Anti-Weight / Counterweight',
    description:
      'a. To compensate for the weight of an object, combine it with another object that provides lift.\n' +
      'b. Use environmental forces such as aerodynamic or hydrodynamic forces, buoyancy, or other forces.',
  },
  {
    id: 9,
    name: 'Preliminary Anti-Action',
    description:
      'a. If an action includes both useful and harmful effects, control the harm by performing an opposite action.\n' +
      'b. Pre-stress objects in which relaxation may appear over time.\n' +
      'c. If an action is required by the problem conditions, perform an opposite action in advance.',
  },
  {
    id: 10,
    name: 'Preliminary Action',
    description:
      'a. Perform, in full or in part, the required change in an object before it is needed.\n' +
      'b. Arrange objects in advance so that they can begin operating from the most convenient position and without time loss.',
  },
  {
    id: 11,
    name: 'Beforehand Cushioning',
    description:
      "Prepare means in advance to compensate for undesirable effects of an object's action.",
  },
  {
    id: 12,
    name: 'Equipotentiality',
    description:
      'a. Limit changes in position; for example, modify conditions so that lifting or lowering is unnecessary.\n' +
      'b. Allow position changes so the object can be placed at the optimal level for performing its action.',
  },
  {
    id: 13,
    name: 'The Other Way Round',
    description:
      'a. Perform the opposite action; for example, cool instead of heating.\n' +
      'b. Make movable parts immovable, and immovable parts movable.\n' +
      'c. Turn the object or process upside down.',
  },
  {
    id: 14,
    name: 'Curvature / Spheroidality',
    description:
      'a. Replace straight-line parts, surfaces, or forms with curved ones.\n' +
      'b. Use domes, cylinders, balls, or spirals.\n' +
      'c. Replace linear motion with rotary motion; use centrifugal force.',
  },
  {
    id: 15,
    name: 'Dynamics',
    description:
      'a. Allow or design the optimal characteristics of an object, external environment, or process.\n' +
      'b. Divide an object into parts capable of moving relative to each other.\n' +
      'c. Make rigid or inflexible objects or processes movable or flexible.',
  },
  {
    id: 16,
    name: 'Partial or Excessive Action',
    description:
      'If it is difficult to achieve 100% of the desired effect, perform slightly less or slightly more, making the problem easier to solve.',
  },
  {
    id: 17,
    name: 'Another Dimension',
    description:
      'a. Move an object in two or three dimensions.\n' +
      'b. Change a single-level structure into a multi-level one.\n' +
      'c. Tilt or turn the object on its side.\n' +
      'd. Use the opposite side of an object or surface.\n' +
      'e. Use light beams directed at the reverse side or a neighboring object.',
  },
  {
    id: 18,
    name: 'Mechanical Vibration',
    description:
      'a. Cause an object to oscillate or vibrate.\n' +
      'b. Increase vibration frequency, up to ultrasonic.\n' +
      'c. Use the resonant frequency of the object.\n' +
      'd. Use piezoelectric effects instead of mechanical vibration.\n' +
      'e. Combine ultrasound with an electromagnetic field to create oscillation or vibration.',
  },
  {
    id: 19,
    name: 'Periodic Action',
    description:
      'a. Replace continuous action with periodic or pulsating action.\n' +
      'b. If action is already periodic, change its amplitude or frequency.\n' +
      'c. Perform additional action during pauses in the main action.',
  },
  {
    id: 20,
    name: 'Continuity of Useful Action',
    description:
      'a. Carry out an action continuously; all parts should work continuously at full load.\n' +
      'b. Eliminate idle, unnecessary, or intermittent actions.\n' +
      'c. Replace reciprocating motion with rotary motion.',
  },
  {
    id: 21,
    name: 'Skipping',
    description:
      'Carry out harmful or hazardous stages of a process at high speed.',
  },
  {
    id: 22,
    name: 'Blessing in Disguise',
    description:
      'a. Use harmful factors of a process or environment to achieve a positive effect.\n' +
      'b. Eliminate a harmful effect by adding another harmful effect.\n' +
      'c. Strengthen a harmful factor until it is no longer harmful.',
  },
  {
    id: 23,
    name: 'Feedback',
    description:
      'a. Introduce feedback to improve an action or process.\n' +
      'b. If feedback is already present, change its intensity or frequency.',
  },
  {
    id: 24,
    name: 'Intermediary',
    description:
      'a. Use an intermediate object or process to transfer an action.\n' +
      'b. Temporarily connect two objects that can later be easily separated.',
  },
  {
    id: 25,
    name: 'Self-Service',
    description:
      'a. An object should service itself by performing auxiliary functions.\n' +
      'b. Use waste products such as energy or substances as resources.',
  },
  {
    id: 26,
    name: 'Copying',
    description:
      'a. Use a simpler or cheaper copy instead of a difficult, expensive, or fragile object.\n' +
      'b. Replace a product or process with its optical copy.\n' +
      'c. If optical copies are already used, move to infrared or ultraviolet copies.',
  },
  {
    id: 27,
    name: 'Cheap Short-Living Objects Instead of Expensive Durable Ones',
    description:
      'Replace an expensive object with several inexpensive ones, giving up certain properties such as long life.',
  },
  {
    id: 28,
    name: 'Mechanics Substitution',
    description:
      'a. Replace a mechanical system with an optical, acoustic, taste-based, or smell-based one.\n' +
      'b. Make the object interact with electric, magnetic, or electromagnetic fields.\n' +
      'c. Move from static to dynamic fields and from unstructured to structured fields.\n' +
      'd. Use fields together with ferromagnetic particles.',
  },
  {
    id: 29,
    name: 'Pneumatics and Hydraulics',
    description:
      'Use gaseous or liquid parts instead of solid ones, such as inflatable, liquid-filled, hydrostatic, or hydro-reactive elements.',
  },
  {
    id: 30,
    name: 'Flexible Shells and Thin Films',
    description:
      'a. Use flexible shells or thin films instead of three-dimensional objects.\n' +
      'b. Separate an object from the external environment using flexible shells or thin films.',
  },
  {
    id: 31,
    name: 'Porous Materials',
    description:
      'a. Make an object porous or add porous elements such as inserts, coatings, or layers.\n' +
      'b. If the object is already porous, add a useful substance or function to the pores.',
  },
  {
    id: 32,
    name: 'Color Changes',
    description:
      'a. Change the color of an object or its environment.\n' +
      'b. Change the transparency of an object or its environment.\n' +
      'c. Use coloring additives to observe poorly visible objects or processes.\n' +
      'd. If such additives are already used, apply tagged atoms or phosphors.',
  },
  {
    id: 33,
    name: 'Homogeneity',
    description:
      'Objects interacting with a given object should be made of the same material or of materials with similar properties.',
  },
  {
    id: 34,
    name: 'Discarding and Recovering',
    description:
      'a. Parts of an object that have fulfilled their function should be discarded, dissolved, or modified during operation.\n' +
      'b. Worn parts should regenerate during operation.',
  },
  {
    id: 35,
    name: 'Parameter Changes',
    description:
      'a. Change the state of an object: gas, liquid, or solid.\n' +
      'b. Change concentration or consistency.\n' +
      'c. Change the degree of flexibility.\n' +
      'd. Change temperature.\n' +
      'e. Change volume.',
  },
  {
    id: 36,
    name: 'Phase Transitions',
    description:
      'Use phenomena occurring during phase transitions, such as volume changes, heat absorption, or heat release.',
  },
  {
    id: 37,
    name: 'Thermal Expansion',
    description:
      'a. Use expansion or contraction of materials caused by temperature.\n' +
      'b. If thermal expansion is already used, employ multiple materials with different thermal expansion coefficients.',
  },
  {
    id: 38,
    name: 'Strong Oxidants / Catalysts',
    description:
      'a. Use catalysts.\n' +
      'b. Replace normal air with oxygen-enriched air.\n' +
      'c. Replace oxygen-enriched air with pure oxygen.\n' +
      'd. Expose air or oxygen to ionizing radiation.\n' +
      'e. Use ionized oxygen.\n' +
      'f. Replace ionized or ozone-enriched oxygen with pure ozone.',
  },
  {
    id: 39,
    name: 'Inert Environment',
    description:
      'a. Replace a normal environment with an inert one.\n' +
      'b. Add neutral additives to an object.\n' +
      'c. Carry out the process in vacuum.',
  },
  {
    id: 40,
    name: 'Composite Materials',
    description:
      'Replace homogeneous materials with composite materials consisting of two or more materials with different properties.',
  },
];

export default function TechnicalContradictionPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [projectName, setProjectName] = useState('');

  const [primaryContradiction, setPrimaryContradiction] =
    useState('');

  const [reverseContradiction, setReverseContradiction] =
    useState('');

  const [improvingIds, setImprovingIds] =
    useState<number[]>([]);

  const [worseningIds, setWorseningIds] =
    useState<number[]>([]);

  const [principles, setPrinciples] =
    useState<Principle[]>([]);

  const [proposedSolution, setProposedSolution] =
    useState('');

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPage();
  }, [projectId]);

  useEffect(() => {
    loadPrinciples();
  }, [improvingIds, worseningIds]);

  async function loadPage() {
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

    const { data: existing, error: existingError } =
      await supabase
        .from('technical_contradictions')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

    if (existingError) {
      setError(existingError.message);
      setLoading(false);
      return;
    }

    if (existing) {
      setPrimaryContradiction(
        existing.primary_contradiction || ''
      );

      setReverseContradiction(
        existing.reverse_contradiction || ''
      );

      setImprovingIds(
        existing.improving_parameter_ids || []
      );

      setWorseningIds(
        existing.worsening_parameter_ids || []
      );

      setProposedSolution(
        existing.proposed_solution || ''
      );
    }

    setLoading(false);
  }

  function toggleImproving(id: number) {
    setError('');
    setMessage('');

    if (improvingIds.includes(id)) {
      setImprovingIds(
        improvingIds.filter((item) => item !== id)
      );
      return;
    }

    if (improvingIds.length >= 5) {
      setError(
        'You can select a maximum of 5 Improving Parameters.'
      );
      return;
    }

    setImprovingIds([...improvingIds, id]);
  }

  function toggleWorsening(id: number) {
    setError('');
    setMessage('');

    if (worseningIds.includes(id)) {
      setWorseningIds(
        worseningIds.filter((item) => item !== id)
      );
      return;
    }

    if (worseningIds.length >= 5) {
      setError(
        'You can select a maximum of 5 Worsening Parameters.'
      );
      return;
    }

    setWorseningIds([...worseningIds, id]);
  }

  async function loadPrinciples() {
    setPrinciples([]);

    if (
      improvingIds.length === 0 ||
      worseningIds.length === 0
    ) {
      return;
    }

    setCalculating(true);
    setError('');

    const { data: matrixRows, error: matrixError } =
      await supabase
        .from('contradiction_matrix')
        .select(
          'improving_parameter_id, worsening_parameter_id, principle_id'
        )
        .in(
          'improving_parameter_id',
          improvingIds
        )
        .in(
          'worsening_parameter_id',
          worseningIds
        );

    if (matrixError) {
      setError(matrixError.message);
      setCalculating(false);
      return;
    }

    const uniquePrincipleIds = Array.from(
      new Set(
        (matrixRows || []).map(
          (row) => Number(row.principle_id)
        )
      )
    ).sort((a, b) => a - b);

    const matchedPrinciples =
      uniquePrincipleIds
        .map((id) =>
          INVENTIVE_PRINCIPLES.find(
            (principle) => principle.id === id
          )
        )
        .filter(
          (principle): principle is Principle =>
            principle !== undefined
        );

    setPrinciples(matchedPrinciples);
    setCalculating(false);
  }

  async function saveTechnicalContradiction(
    goNext = false
  ) {
    setError('');
    setMessage('');

    if (!primaryContradiction.trim()) {
      setError(
        'Please describe the Primary Technical Contradiction.'
      );
      return;
    }

    if (!reverseContradiction.trim()) {
      setError(
        'Please describe the Reverse Technical Contradiction.'
      );
      return;
    }

    if (improvingIds.length === 0) {
      setError(
        'Please select at least one Improving Parameter.'
      );
      return;
    }

    if (worseningIds.length === 0) {
      setError(
        'Please select at least one Worsening Parameter.'
      );
      return;
    }

    setSaving(true);

    const { error: saveError } =
      await supabase
        .from('technical_contradictions')
        .upsert(
          {
            project_id: projectId,

            primary_contradiction:
              primaryContradiction.trim(),

            reverse_contradiction:
              reverseContradiction.trim(),

            improving_parameter_ids:
              improvingIds,

            worsening_parameter_ids:
              worseningIds,

            proposed_solution:
              proposedSolution.trim(),
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
      const { error: projectError } =
        await supabase
          .from('projects')
          .update({
            current_step:
              'Physical Contradiction',
          })
          .eq('id', projectId);

      if (projectError) {
        setSaving(false);
        setError(projectError.message);
        return;
      }

      router.push(
        `/project/${projectId}/physical-contradiction`
      );

      return;
    }

    setSaving(false);

    setMessage(
      'Technical Contradiction saved successfully.'
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2e9] text-[#123d36]">
        <p className="font-semibold">
          Loading Technical Contradiction...
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
            onClick={() =>
              router.push('/dashboard')
            }
            className="rounded-lg border border-[#123d36] px-5 py-2.5 text-sm font-semibold hover:bg-[#edf3f1]"
          >
            My Projects
          </button>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-10">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#57b89d]">
            Step 8 of 10
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Technical Contradiction
          </h2>

          <p className="mt-3 text-[#66736f]">
            {projectName}
          </p>

        </div>

        <div className="mb-8 rounded-2xl bg-[#e8f5f1] p-6">

          <p className="font-semibold">
            Define the Technical Contradiction.
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#5e706b]">
            Describe both forms of the contradiction,
            then select the engineering parameters
            that improve and worsen. The TRIZ
            Contradiction Matrix will automatically
            suggest relevant Inventive Principles.
          </p>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          <TextArea
            label="Primary Technical Contradiction"
            placeholder="If we improve..., then..., but..."
            value={primaryContradiction}
            onChange={setPrimaryContradiction}
          />

          <TextArea
            label="Reverse Technical Contradiction"
            placeholder="If we do the opposite..., then..., but..."
            value={reverseContradiction}
            onChange={setReverseContradiction}
          />

        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          <ParameterBox
            title="Improving Parameters"
            subtitle={`${improvingIds.length} / 5 selected`}
            parameters={ENGINEERING_PARAMETERS}
            selected={improvingIds}
            onToggle={toggleImproving}
          />

          <ParameterBox
            title="Worsening Parameters"
            subtitle={`${worseningIds.length} / 5 selected`}
            parameters={ENGINEERING_PARAMETERS}
            selected={worseningIds}
            onToggle={toggleWorsening}
          />

        </div>

        <div className="mt-8 rounded-3xl bg-[#123d36] p-7 text-white">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7ed6bc]">
            TRIZ Contradiction Matrix
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            Suggested Inventive Principles
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
            The recommendations below are generated
            automatically from every selected
            Improving Parameter × Worsening Parameter
            combination. Duplicate principles are
            removed automatically.
          </p>

          {calculating ? (

            <div className="mt-8 rounded-2xl bg-white/10 p-6">
              Analysing contradiction matrix...
            </div>

          ) : improvingIds.length === 0 ||
              worseningIds.length === 0 ? (

            <div className="mt-8 rounded-2xl bg-white/10 p-6">
              Select at least one Improving Parameter
              and one Worsening Parameter to generate
              recommendations.
            </div>

          ) : principles.length === 0 ? (

            <div className="mt-8 rounded-2xl bg-white/10 p-6">
              No Inventive Principles were found for
              the selected parameter combinations.
            </div>

          ) : (

            <div className="mt-8 grid gap-5 lg:grid-cols-2">

              {principles.map((principle) => (

                <div
                  key={principle.id}
                  className="rounded-2xl bg-white p-6 text-[#123d36]"
                >

                  <div className="flex items-start gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dff3eb] text-lg font-bold">
                      {String(
                        principle.id
                      ).padStart(2, '0')}
                    </div>

                    <div className="min-w-0">

                      <h4 className="text-xl font-bold">
                        {principle.name}
                      </h4>

                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#66736f]">
                        {principle.description}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm">

          <label className="block text-lg font-bold">
            Proposed Solution
          </label>

          <p className="mt-2 text-sm leading-6 text-[#66736f]">
            Optional. After reviewing the suggested
            Inventive Principles, describe your own
            solution concept.
          </p>

          <textarea
            value={proposedSolution}
            onChange={(e) =>
              setProposedSolution(
                e.target.value
              )
            }
            rows={7}
            placeholder="Describe your proposed solution..."
            className="mt-5 w-full resize-none rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
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
              router.push(
                `/project/${projectId}/ceca`
              )
            }
            className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold"
          >
            ← Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              onClick={() =>
                saveTechnicalContradiction(
                  false
                )
              }
              disabled={saving}
              className="rounded-xl border border-[#123d36] px-7 py-3.5 font-semibold disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Save'}
            </button>

            <button
              onClick={() =>
                saveTechnicalContradiction(
                  true
                )
              }
              disabled={saving}
              className="rounded-xl bg-[#123d36] px-7 py-3.5 font-semibold text-white disabled:opacity-50"
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

/* =========================================================
   TEXT AREA
   ========================================================= */

function TextArea({
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
    <div className="rounded-3xl bg-white p-7 shadow-sm">

      <label className="text-lg font-bold">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        rows={6}
        className="mt-4 w-full resize-none rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
      />

    </div>
  );
}

/* =========================================================
   PARAMETER LIST
   ========================================================= */

function ParameterBox({
  title,
  subtitle,
  parameters,
  selected,
  onToggle,
}: {
  title: string;
  subtitle: string;
  parameters: Parameter[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-7 shadow-sm">

      <div className="flex items-center justify-between gap-4">

        <h3 className="text-xl font-bold">
          {title}
        </h3>

        <span className="rounded-full bg-[#dff3eb] px-3 py-1 text-xs font-bold">
          {subtitle}
        </span>

      </div>

      <p className="mt-2 text-sm text-[#66736f]">
        Select up to five Standard TRIZ Engineering
        Parameters.
      </p>

      <div className="mt-6 max-h-[600px] space-y-2 overflow-y-auto pr-2">

        {parameters.map((parameter) => {

          const active =
            selected.includes(parameter.id);

          return (
            <button
              key={parameter.id}
              type="button"
              onClick={() =>
                onToggle(parameter.id)
              }
              className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-[#123d36] bg-[#dff3eb]'
                  : 'border-[#d8d5ca] bg-white hover:bg-[#f5f5f2]'
              }`}
            >

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? 'bg-[#123d36] text-white'
                    : 'bg-[#ececea] text-[#123d36]'
                }`}
              >
                {String(
                  parameter.id
                ).padStart(2, '0')}
              </div>

              <span className="font-semibold">
                {parameter.name}
              </span>

            </button>
          );

        })}

      </div>

    </div>
  );
}
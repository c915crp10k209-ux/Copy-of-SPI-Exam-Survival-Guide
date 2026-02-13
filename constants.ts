
import { Topic, TopicMetadata, GlossaryTerm, FieldMission, FormulaNode, IntelArchive } from './types';
import { getContentOverrides } from './services/storageService';

export const INTEL_ARCHIVES: IntelArchive[] = [
  {
    id: 'intel_1',
    title: 'Beam Anatomy Decryption',
    summary: 'Mastering the Fresnel and Fraunhofer zones is critical for lateral resolution control.',
    sector: '02_Transducers',
    visualId: 'BeamFocusingVisual',
    unlockXp: 1500,
    content: `
### The anatomy of an ultrasound beam is a journey through two distinct fields.

1. **The Fresnel Zone (Near Field)**: This is the region closest to the transducer. The beam diameter decreases here. It is governed by crystal diameter and frequency. Shorter zone = less resolution at depth.
2. **The Fraunhofer Zone (Far Field)**: This is the region where the beam diverges. Once past the focal point, you lose lateral resolution.

**Tactical Rule**: Always place your focus at or just below the structure of interest. Lateral resolution is at its peak (best) at the narrowest point of the beam.
    `
  }
];

export const SPI_FORMULAS: FormulaNode[] = [
  {
    id: 'f1',
    title: 'Range Equation',
    equation: 'd = (1.54 mm/µs × t) / 2',
    description: 'Calculates the distance to a reflector based on go-return time.',
    category: 'ACOUSTICS',
    variables: { 'd': 'Depth (mm)', 't': 'Go-return time (µs)', '1.54': 'Soft tissue propagation speed' }
  }
];

export const FIELD_MISSIONS: FieldMission[] = [
  {
    id: 'm1',
    title: 'Ghost in the Machine',
    description: 'A shadow appears beneath a suspicious liver mass. Is it pathology or physics?',
    difficulty: 'LEVEL_1',
    visualId: 'PropagationArtifactsVisual',
    objective: 'Match the acoustic mismatch to identify the cause of posterior shadowing.',
    solution: 'Shadowing is caused by high attenuation structures. You correctly matched the high mismatch parameter.',
    hint: 'Think about the attenuation coefficient of bone vs soft tissue.',
    topic: Topic.MODULE_1,
    targetState: { mismatch: 75 }
  }
];

export const GLOSSARY_TERMS: Record<string, GlossaryTerm> = {
  'Compression': {
    term: 'Compression',
    category: 'Physics',
    definition: 'A region of high pressure and high density in a longitudinal wave.',
    clinicalSignificance: 'Compressions represent the peak energy levels in the ultrasound beam interacting with tissue.',
    visualId: 'LongitudinalWaveVisual'
  }
};

const BASE_TOPICS: Record<Topic, TopicMetadata> = {
  [Topic.MODULE_1]: {
    id: Topic.MODULE_1,
    icon: 'fa-wave-square',
    color: 'blue',
    description: 'Master the fundamental nature of sound as a mechanical, longitudinal wave.',
    subTopics: [
      {
        id: '1-1',
        title: 'Wave Kinetics',
        description: 'Sound is energy traveling through a medium via particle oscillation.',
        visualId: 'LongitudinalWaveVisual',
        keywords: ['Compression', 'Rarefaction'],
        lecture: {
          title: "Mission: The First Vibration",
          nodes: [
            {
              id: 'n1',
              chapterTitle: "The Effort Metric",
              voice: 'Charon',
              visualId: 'LongitudinalWaveVisual',
              type: 'ROADMAP',
              narrative: "Greetings Operator. Listen close: I've scanned 500 physics cases and 12 textbooks for you. I'm delivering the cliffnotes version so you don't spend 40 hours highlighting lines you'll never remember. This is pure tactical intel."
            },
            {
              id: 'n2',
              chapterTitle: "Part 1: The Negation",
              voice: 'Puck',
              visualId: 'WaveParametersVisual',
              type: 'NEGATION',
              narrative: "What even is sound? Easiest way to know is to see what it is NOT. Sound is NOT a laser. Light is a loner; it doesn't need anyone. Sound is a socialite—it is NOT capable of traveling without a medium. No air or tissue? No mission. It needs a partner to dance."
            },
            {
              id: 'n3',
              chapterTitle: "Part 2: The Particle Stadium",
              voice: 'Zephyr',
              visualId: 'LongitudinalWaveVisual',
              type: 'ANALOGY',
              narrative: "Imagine a stadium wave. The fans stay in their seats, but the energy travels through the whole crowd. That's sound! The particles oscillate back and forth, hitting their neighbors and then returning home. The energy moves, but the matter stays local."
            },
            {
              id: 'n4',
              chapterTitle: "The Mechanical Core",
              voice: 'Charon',
              visualId: 'LongitudinalWaveVisual',
              type: 'ROADMAP',
              narrative: "Because sound needs that physical medium, we call it a Mechanical wave. And because it moves in the same direction as the wave itself, we call it Longitudinal. Remember those two words: they are the foundation of your entire clinical career."
            },
            {
              id: 'n5',
              chapterTitle: "Mnemonic Lock",
              voice: 'Puck',
              visualId: 'LongitudinalWaveVisual',
              type: 'MNEMONIC',
              narrative: "Can't remember the rules? Just think: Lively Mice Sing. L for Longitudinal, M for Mechanical, and S for Straight Line. If it doesn't do those three things, it isn't sound. It's just a glitch."
            },
            {
              id: 'n6',
              chapterTitle: "Compression vs Rarefaction",
              voice: 'Zephyr',
              visualId: 'LongitudinalWaveVisual',
              type: 'PRACTICAL',
              narrative: "Look at the particles now. When they bunch up, that's High Pressure—Compression. When they spread out? That's Low Pressure—Rarefaction. The ultrasound machine is literally just measuring the timing between these bunched-up energy packets."
            },
            {
              id: 'n7',
              chapterTitle: "The High Frequency Trade-off",
              voice: 'Charon',
              visualId: 'WaveParametersVisual',
              type: 'PRACTICAL',
              narrative: "When you crank up the Frequency, those bunched-up groups get closer together. This gives you beautiful axial resolution, but here's the catch: the waves get tired faster. High frequency is the Ferrari of ultrasound: fast and pretty, but it can't go off-road into deep tissue."
            },
            {
              id: 'n8',
              chapterTitle: "The Holy Sh*t Insight",
              voice: 'Puck',
              visualId: 'LongitudinalWaveVisual',
              type: 'ANALOGY',
              narrative: "The mind-blowing part? Sound doesn't 'move' through space. It's a sequence of pressure changes. You aren't 'sending' a beam; you're vibrating the patient's skin, and they are vibrating the tissue underneath. You are literally 'feeling' the patient with energy."
            },
            {
              id: 'n9',
              chapterTitle: "Psychology: The 2-Minute Rule",
              voice: 'Zephyr',
              visualId: 'LongitudinalWaveVisual',
              type: 'PSYCHOLOGY',
              narrative: "You don't rise to the level of your SPI goals; you fall to the level of your systems. Use the 2-minute rule: just open this sim for two minutes every morning. Push the button of consistency until the physics becomes instinct."
            },
            {
              id: 'n10',
              chapterTitle: "Sync Assessment",
              voice: 'Charon',
              visualId: 'LongitudinalWaveVisual',
              type: 'ASSESSMENT',
              narrative: "Presentation complete. Now, prove you were synced. I've activated three Knowledge Probes below. If you can answer them without guessing, you are officially Synchronized on Wave Kinetics. Good luck, Operator."
            }
          ]
        },
        content: {
          hook: "Sound is a desperate dance of particles needing a partner!",
          promise: "Master wave mechanics and you control the foundation of all clinical imaging.",
          roadmap: ["Mechanical vs Electromagnetic", "Longitudinal Motion", "Pressure Gradients"],
          negation: "Sound is NOT light. It cannot travel in a vacuum!",
          mnemonic: "Think: 'LMS' - Longitudinal, Mechanical, Straight Line.",
          analogy: "Like a stadium wave: particles stay home, but the energy travels!",
          practical: "Higher frequency = Shorter wavelength = Better resolution.",
          mindset: "Follow the energy, not the particles.",
          assessment: ["Is sound longitudinal?", "Can it travel in space?", "What bunched up particles are called?"]
        }
      }
    ]
  },
  [Topic.MODULE_2]: { id: Topic.MODULE_2, icon: 'fa-satellite-dish', color: 'indigo', description: 'Unpack the PZT core and the science of energy conversion.', subTopics: [] },
  [Topic.MODULE_3]: { id: Topic.MODULE_3, icon: 'fa-stopwatch', color: 'cyan', description: 'Control the timing and duration of pulsed acoustic events.', subTopics: [] },
  [Topic.MODULE_4]: { id: Topic.MODULE_4, icon: 'fa-heartbeat', color: 'pink', description: 'Listen to the music of moving blood via frequency shifts.', subTopics: [] },
  [Topic.MODULE_5]: { id: Topic.MODULE_5, icon: 'fa-ghost', color: 'purple', description: 'Recognize the visual lies sound tells in the patient.', subTopics: [] },
  [Topic.MODULE_6]: { id: Topic.MODULE_6, icon: 'fa-shield-alt', color: 'orange', description: 'Acoustic power and its biological consequences.', subTopics: [] },
  [Topic.MODULE_7]: { id: Topic.MODULE_7, icon: 'fa-tint', color: 'red', description: 'Fluid mechanics and the energy of blood.', subTopics: [] },
  [Topic.MODULE_8]: { id: Topic.MODULE_8, icon: 'fa-ruler-combined', color: 'emerald', description: 'Quality assurance and system validation.', subTopics: [] },
  [Topic.MODULE_9]: { id: Topic.MODULE_9, icon: 'fa-compress-arrows-alt', color: 'lime', description: 'Detail resolution and the holy grail of imaging.', subTopics: [] },
  [Topic.MODULE_10]: { id: Topic.MODULE_10, icon: 'fa-music', color: 'fuchsia', description: 'Non-linear propagation and the harmonic echo.', subTopics: [] },
  [Topic.MODULE_11]: { id: Topic.MODULE_11, icon: 'fa-tv', color: 'slate', description: 'The receiver chain and signal processing.', subTopics: [] },
  [Topic.MODULE_12]: { id: Topic.MODULE_12, icon: 'fa-microscope', color: 'amber', description: 'Elastography, 3D, and the cutting edge.', subTopics: [] },
  [Topic.FULL_MOCK]: { id: Topic.FULL_MOCK, icon: 'fa-file-invoice', color: 'indigo', description: 'Comprehensive Mock Examination covering all 12 modules.', subTopics: [] }
};

export const getDynamicTopics = (): Record<Topic, TopicMetadata> => {
    const overrides = getContentOverrides();
    const merged = { ...BASE_TOPICS };
    Object.keys(overrides).forEach((topicId) => {
        const id = topicId as Topic;
        if (merged[id]) merged[id] = { ...merged[id], ...overrides[topicId] };
    });
    return merged;
};

export const TOPICS = getDynamicTopics();

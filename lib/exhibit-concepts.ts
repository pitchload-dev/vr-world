export const exhibitConcepts = {
  1: {
    kind: 'circular',
    title: 'Concrete into resources',
    action: 'SORT MATERIALS',
    description:
      'Concrete fragments separate into three material groups. A small CO₂ molecule represents carbon storage during resource recovery.',
    source: 'https://www.rement.tech/',
  },
  2: {
    kind: 'engineering',
    title: 'From specifications to insight',
    action: 'REVIEW SPECS',
    description:
      'Specification sheets connect to an AI core and an engineering component. Select to fan out the documents: a metaphor for engineering knowledge and specification assessment.',
    source: 'https://www.semor.ai/',
  },
  3: {
    kind: 'isolation',
    title: 'A physical gap for security',
    action: 'REVEAL THE GAP',
    description:
      'Two hardware blocks stay physically separate, with an optical signal between them. Select to widen the gap and reveal hardware-enforced endpoint isolation.',
    source: 'https://www.viss.cc/',
  },
  4: {
    kind: 'swarm',
    title: 'One load. A robot team.',
    action: 'MOVE TOGETHER',
    description:
      'Four small transport modules support one oversized load. Select to move them together, illustrating coordinated modular vehicles for heavy and bulky goods.',
    source: 'https://formic-transportsystem.com/',
  },
  5: {
    kind: 'assurance',
    title: 'Checks around an AI core',
    action: 'REVEAL CHECKS',
    description:
      'An AI core sits inside three inspection frames. Select to separate the frames and reveal a check mark: a metaphor for AI inventory, testing and governance, not a certification.',
    source: 'https://www.validaitor.com/',
  },
  6: {
    kind: 'nanotexture',
    title: 'The surface makes the difference',
    action: 'MAGNIFY TEXTURE',
    description:
      'A smooth metal tile sits beside a structured tile of the same material. Select to magnify tiny surface features. Functional topography without a separate coating; dimensions are not to scale.',
    source: 'https://nanoshape.de/en/technology',
  },
  7: {
    kind: 'heat-power',
    title: 'Waste heat into electricity',
    action: 'CONVERT HEAT',
    description:
      'Warm waves feed a rotating wheel and a light symbol. Select to activate the flow: unused heat becomes mechanical work and electricity. This is a metaphor, not a machine blueprint.',
    source:
      'https://kit-gruenderschmiede.de/kit-startups-auf-der-hannover-messe-2026/',
  },
  8: {
    kind: 'conductive',
    title: 'Particles make a connection',
    action: 'SHOW THE PATH',
    description:
      'Metallic particles form a continuous path across a surface. Select to reveal the connection: efficient use of conductive particles in printed electronics, not a depiction of the manufacturing process.',
    source: 'https://www.karlsruhe-conductive-materials.de/applications/',
  },
  9: {
    kind: 'unconfirmed',
    title: 'An open concept',
    action: 'OPEN THE FORM',
    description:
      'An open geometric frame is a neutral preview. Sparseon’s activity has not yet been confirmed for this exhibition; this object does not claim to represent its technology.',
  },
  10: {
    kind: 'explainable',
    title: 'Data becomes a readable formula',
    action: 'REVEAL FORMULA',
    description:
      'Measurements are joined by a simple curve and the example formula y = x². Select to reveal the formula: a metaphor for explainable mathematical predictions, using invented example data.',
    source:
      'https://www.helmholtz.de/en/transfer/helmholtz-association-transfer-instruments/helmholtz-enterprise/',
  },
  11: {
    kind: 'sun-hydrogen',
    title: 'Sunlight + water → hydrogen',
    action: 'RELEASE HYDROGEN',
    description:
      'A sun illuminates a panel beside a water molecule. Select to release paired hydrogen spheres, illustrating direct hydrogen production from sunlight and water. Panel geometry and molecules are schematic.',
    source: 'https://photreon.com/',
  },
} as const;
export type ExhibitKind =
  (typeof exhibitConcepts)[keyof typeof exhibitConcepts]['kind'];
export function exhibitConcept(id: number) {
  return (
    exhibitConcepts[id as keyof typeof exhibitConcepts] || exhibitConcepts[9]
  );
}

export type CompanyProfile = {
  provenance?: 'pitchload' | 'provided';
  legalName?: string;
  handle?: string;
  category?: string;
  aboutShort?: string;
  description?: string;
  website?: string;
  email?: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  created?: string;
  changed?: string;
  employees?: number;
  foundingYear?: number;
  stage?: string;
  businessReadinessLevel?: string;
  goToMarketModel?: string;
  productType?: string;
  productReadinessLevel?: string;
  technologyReadinessLevel?: string;
  founders?: number;
  region?: string;
  industry?: string;
  legalForm?: string;
  incorporated?: boolean;
  femaleFounders?: boolean;
  firstTimeFounders?: boolean;
  seekingInvestment?: boolean;
  investmentSize?: number;
};
export type Startup = {
  profile?: CompanyProfile;
  contentSource?: 'pitchload' | 'preview';
  logoUrl?: string;
  city?: string;
  employees?: number;
  foundingYear?: number;
  id: number;
  name: string;
  sector: string;
  color: string;
  headline: string;
  description: string;
  source?: string;
  sourceLabel?: string;
  exhibit: string;
  model: string;
  jobs: {
    title: string;
    location: string;
    url: string;
    description?: string;
  }[];
  pending?: boolean;
};
const fair =
  'https://kit-gruenderschmiede.de/kit-startups-auf-der-hannover-messe-2026/';
export const startups: Startup[] = [
  {
    id: 1,
    name: 'REMENT',
    sector: 'Circular materials',
    color: '#b6ce57',
    headline: 'A new life for concrete.',
    description:
      'REMENT develops a process that recovers raw materials from demolition concrete while storing CO₂. The team is working toward a circular material supply for construction and the chemical industry.',
    source:
      'https://kit-gruenderschmiede.de/en/rement-is-kits-newest-investment/',
    sourceLabel: 'KIT-Gründerschmiede',
    exhibit: 'Concrete into resources',
    model: 'circular',
    jobs: [
      {
        title: 'Development Engineer (m/f/d)',
        location:
          'Karlsruhe · Full time · Published listing; availability to confirm',
        url: 'https://www.fs-fmc.kit.edu/sites/default/files/schwarzes_brett/RementDevelopmentengineermfd.pdf',
      },
    ],
  },
  {
    id: 2,
    name: 'Semorai',
    sector: 'Engineering AI',
    color: '#ab9bfa',
    headline: 'More freedom for engineers.',
    description:
      'Semorai develops an engineering intelligence platform for specification assessment, standards management and enterprise knowledge. Founded at KIT, the team helps engineers spend less time searching and more time developing.',
    source: 'https://semor.ai/en/about',
    sourceLabel: 'Semorai',
    exhibit: 'From specifications to insight',
    model: 'engineering',
    jobs: [
      {
        title: 'AI Engineer (m/f/d)',
        location:
          'Heilbronn / Munich · Full time · Published listing; availability to confirm',
        url: 'https://hr.semorai.com/jobs/HR-OPN-2025-0002',
      },
    ],
  },
  {
    id: 3,
    name: 'Viss',
    sector: 'Cybersecurity',
    color: '#79c6f0',
    headline: 'Security at the physical layer.',
    description:
      'VISS develops hardware for endpoint protection. Its VISSBOX architecture uses physical and optical separation between networks and connected devices, with applications in industry and critical infrastructure.',
    source: 'https://www.viss.cc/',
    sourceLabel: 'VISS',
    exhibit: 'A physical gap for security',
    model: 'isolation',
    jobs: [],
  },
  {
    id: 4,
    name: 'FORMIC',
    sector: 'Startup showcase',
    color: '#f2a971',
    headline: 'Meet FOMRIC.',
    description:
      'A featured startup in this exhibition. The company profile and product experience are awaiting information from the event team.',
    exhibit: 'One load. A robot team.',
    model: 'swarm',
    jobs: [],
    pending: true,
  },
  {
    id: 5,
    name: 'Validaitor',
    sector: 'Trustworthy AI',
    color: '#85b9fe',
    headline: 'Make AI trust measurable.',
    description:
      'Validaitor brings AI inventory, governance, testing and compliance workflows into one platform. Its tools help organizations discover AI assets, assess risks and test AI systems.',
    source: 'https://www.validaitor.com/',
    sourceLabel: 'Validaitor',
    exhibit: 'Checks around an AI core',
    model: 'assurance',
    jobs: [],
  },
  {
    id: 6,
    name: 'Nanoshape',
    sector: 'Surface technology',
    color: '#7ad1c2',
    headline: 'Small structures. New possibilities.',
    description:
      'Nanoshape develops nanostructured metallic surfaces inspired by nature. Its technology modifies the material itself, with applications including medical implants and industrial components.',
    source: 'https://nanoshape.de/en/about-us',
    sourceLabel: 'Nanoshape',
    exhibit: 'The surface makes the difference',
    model: 'nanotexture',
    jobs: [],
  },
  {
    id: 7,
    name: 'Superheated',
    sector: 'Energy technology',
    color: '#f3a774',
    headline: 'Give waste heat a purpose.',
    description:
      'SuperHeated develops a piston expansion machine that converts unused heat into electricity. An innovative control system is designed to handle small and fluctuating heat streams in industrial and maritime applications.',
    source: fair,
    sourceLabel: 'KIT-Gründerschmiede',
    exhibit: 'Waste heat into electricity',
    model: 'heat-power',
    jobs: [],
  },
  {
    id: 8,
    name: 'KCM',
    sector: 'Conductive materials',
    color: '#dbbb78',
    headline: 'Rethinking printed electronics.',
    description:
      'Karlsruhe Conductive Materials develops conductive materials for printed electronics. Its approach uses conductive particles more efficiently to improve conductivity and reduce material demand.',
    source: fair,
    sourceLabel: 'KIT-Gründerschmiede',
    exhibit: 'Particles make a connection',
    model: 'conductive',
    jobs: [],
  },
  {
    id: 9,
    name: 'Sparseon',
    sector: 'Startup showcase',
    color: '#a9bad2',
    headline: 'Meet Sparseon.',
    description:
      'A featured startup in this exhibition. The company profile and product experience are awaiting information from the event team.',
    exhibit: 'An open concept',
    model: 'unconfirmed',
    jobs: [],
    pending: true,
  },
  {
    id: 10,
    name: 'Formetis',
    sector: 'Explainable AI',
    color: '#d0a2df',
    headline: 'Predictions you can understand.',
    description:
      'Formetis develops explainable AI software that expresses predictions as human-readable mathematical formulas. The approach supports transparent decision-making and interpretable models.',
    source:
      'https://www.helmholtz.de/en/transfer/helmholtz-association-transfer-instruments/helmholtz-enterprise/',
    sourceLabel: 'Helmholtz Association',
    exhibit: 'Data becomes a readable formula',
    model: 'explainable',
    jobs: [],
  },
  {
    id: 11,
    name: 'Photreon',
    sector: 'Solar hydrogen',
    color: '#e4ca5c',
    headline: 'Sunlight. Water. Hydrogen.',
    description:
      'Photreon develops solar panels for direct green hydrogen production from sunlight and water. The KIT spin-off is developing a scalable approach that does not first convert sunlight into electricity.',
    source: 'https://photreon.com/',
    sourceLabel: 'Photreon',
    exhibit: 'Sunlight + water → hydrogen',
    model: 'sun-hydrogen',
    jobs: [],
  },
];
export function placement(index: number) {
  if (index < 4) return { x: -12, z: 10 - index * 8, r: Math.PI / 2 };
  if (index < 8) return { x: 12, z: 10 - (index - 4) * 8, r: -Math.PI / 2 };
  return { x: (index - 9) * 8, z: -21, r: 0 };
}

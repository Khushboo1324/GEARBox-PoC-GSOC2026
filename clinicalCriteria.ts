export type ClinicalCriteriaCategory = 'GENOMIC' | 'LAB_VALUE' | 'DEMOGRAPHIC';

type ClinicalCriteriaBase = {
  /** Stable identifier for this criterion */
  id: string;
  /** High-level grouping label (e.g., "Eligibility", "Exclusion", "Biomarker") */
  category: string;
};

export type GenomicCriteria = ClinicalCriteriaBase & {
  kind: 'GENOMIC';
  geneName: string;
  mutationType: string;
  isPresent: boolean;
};

export type LabValueComparator = '>' | '>=' | '<' | '<=' | '==' | '!=';

export type LabValueCriteria = ClinicalCriteriaBase & {
  kind: 'LAB_VALUE';
  testName: string;
  numericValue: number;
  unit: string;
  comparator: LabValueComparator;
};

export type DemographicCriteria = ClinicalCriteriaBase & {
  kind: 'DEMOGRAPHIC';
  attribute: string;
  value: string;
};

/**
 * Discriminated union for clinical eligibility criteria.
 * Discriminant: `kind`
 */
export type ClinicalCriteria = GenomicCriteria | LabValueCriteria | DemographicCriteria;

export type MockClinicalCriteriaOptions = {
  /** Number of items to generate (default: 5000). */
  count?: number;
  /** Seed-like starting index used to create stable IDs (default: 0). */
  startIndex?: number;
};

const CATEGORY_LABELS = ['Eligibility', 'Exclusion', 'Biomarker', 'History', 'Treatment','Pediatric'] as const;

const GENES = [
  'BRCA1',
  'BRCA2',
  'EGFR',
  'ALK',
  'KRAS',
  'BRAF',
  'TP53',
  'PIK3CA',
  'ROS1',
  'MET',
  'ERBB2',
] as const;

const MUTATIONS = ['SNV', 'Insertion', 'Deletion', 'Fusion', 'Amplification'] as const;

const LAB_TESTS = [
  { name: 'Hemoglobin', unit: 'g/dL', mean: 13.5, sd: 1.8 },
  { name: 'Creatinine', unit: 'mg/dL', mean: 1.0, sd: 0.3 },
  { name: 'ALT', unit: 'U/L', mean: 28, sd: 15 },
  { name: 'AST', unit: 'U/L', mean: 26, sd: 14 },
  { name: 'Platelets', unit: '10^9/L', mean: 250, sd: 60 },
  { name: 'WBC', unit: '10^9/L', mean: 7.0, sd: 2.0 },
  { name: 'Bilirubin', unit: 'mg/dL', mean: 0.8, sd: 0.4 },
] as const;

const COMPARATORS: LabValueComparator[] = ['>', '>=', '<', '<=', '==', '!='];

const DEMO_ATTRS = [
  { attribute: 'age', values: ['18', '21', '30', '40', '50', '60', '65', '70'] },
  { attribute: 'sex', values: ['female', 'male', 'intersex', 'unknown'] },
  { attribute: 'race', values: ['asian', 'black', 'white', 'native', 'other', 'unknown'] },
  { attribute: 'smokingStatus', values: ['never', 'former', 'current', 'unknown'] },
] as const;

function pick<T>(arr: readonly T[], n: number): T {
  return arr[n % arr.length];
}

function pseudoNormal(index: number): number {
  const u1=((Math.sin(index * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const u2= ((Math.sin((index + 1) * 78.233) * 96234.876) % 1 + 1) % 1;
  const r= Math.sqrt(-2.0 * Math.log(Math.max(u1, 1e-12)));
  const theta= 2.0 * Math.PI * u2;
  return r * Math.cos(theta);
}

function makeId(i: number): string {
  return `cc_${String(i).padStart(6, '0')}`;
}

function makeGenomic(i: number): GenomicCriteria {
  return {
    id:makeId(i),
    category:pick(CATEGORY_LABELS, i),
    kind:'GENOMIC',
    geneName:pick(GENES, i),
    mutationType:pick(MUTATIONS, i * 7),
    isPresent: i % 3!== 0,
  };
}

function makeLabValue(i: number): LabValueCriteria {
  const test= pick(LAB_TESTS, i);
  const z =pseudoNormal(i);
  const value= test.mean + z * test.sd;

  return {
    id: makeId(i),
    category:pick(CATEGORY_LABELS, i),
    kind: 'LAB_VALUE',
    testName: test.name,
    numericValue: Number(value.toFixed(2)),
    unit: test.unit,
    comparator: pick(COMPARATORS, i * 5),
  };
}

function makeDemographic(i: number): DemographicCriteria {
  const spec =pick(DEMO_ATTRS, i);
  return {
    id: makeId(i),
    category:pick(CATEGORY_LABELS, i),
    kind: 'DEMOGRAPHIC',
    attribute:spec.attribute,
    value: pick(spec.values, i * 11),
  };
}


//   Create a list of mock `ClinicalCriteria` items.
//  The generator is deterministic (based on index), which helps with reproducible tests.
export function createMockClinicalCriteria(
  options: MockClinicalCriteriaOptions = {},
): ClinicalCriteria[] {
  const { count = 5000, startIndex = 0 } = options;
  const items: ClinicalCriteria[] = new Array(count);

  for (let n =0; n <count; n++) {
    const i= startIndex +n;
    const mod= i % 3;

    items[n] =mod === 0 ? makeGenomic(i) : mod=== 1 ? makeLabValue(i) : makeDemographic(i);
  }

  return items;
}

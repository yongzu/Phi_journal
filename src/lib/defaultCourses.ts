import type { Course } from '../types';
import { GENERAL_COURSE_ID } from '../types';

// phi.design/programs 의 1학기 주요 수업을 기반으로 한 기본값입니다.
// 과목 코드(약어)는 실제 저널에서 쓰는 표기와 다를 수 있으니 설정 화면에서 자유롭게 수정하세요.
export const DEFAULT_COURSES: Course[] = [
  { id: GENERAL_COURSE_ID, code: 'general', name: '공통 / 미분류', aliases: ['공통', '전체'] },
  { id: 'ips', code: 'IPS', name: 'Iterative Problem Solving', aliases: [] },
  { id: 'bi', code: 'BI', name: 'Beautiful Interface', aliases: [] },
  { id: 'vt', code: 'VT', name: 'Visual Translation', aliases: [] },
  { id: 'iae', code: 'IAE', name: 'Interviewing as Exploration', aliases: [] },
  { id: 'aor', code: 'AOR', name: 'Art of Reading', aliases: [] },
  { id: 'eai', code: 'EAI', name: 'Engaging with AI', aliases: [] },
  { id: 'al', code: 'AL', name: 'Aesthetic Literacy', aliases: [] },
  { id: 'tf', code: 'TF', name: 'Typography as Foundation', aliases: ['TAF'] },
  { id: 'si', code: 'SI', name: 'Self Introduction', aliases: [] },
  { id: 'wi', code: 'WI', name: 'What If', aliases: [] },
  { id: 'pc', code: 'PC', name: 'Peer Coaching', aliases: [] },
  { id: 'rw', code: 'RW', name: 'Readable Writing', aliases: [] },
];

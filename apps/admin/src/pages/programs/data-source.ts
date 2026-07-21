// 프로그램 데이터 소스 어댑터
//
// [백엔드 연동 지점] 공용 CRUD 프레임워크의 CrudAdapter 를 ./_shared/store 위에 배선한다.
// 카테고리는 삭제 차단(사용 중·하위 있음)을 store 가 강제한다 — 서버는 409 로 같은 규칙을 건다.
import { createStoreAdapter } from '../../shared/crud';
import {
  addProgram,
  addProgramCategory,
  getProgram,
  getProgramCategoryUsage,
  listProgramCategories,
  listProgramCategoryUsage,
  listPrograms,
  removeProgram,
  removeProgramCategory,
  updateProgram,
  updateProgramCategory,
} from './_shared/store';
import type { Program, ProgramCategory, ProgramCategoryUsage, ProgramInput } from './_shared/store';
import type { ProgramCategoryInput } from './types';

/** react-query 키 루트 겸 실패 스코프 */
export const PROGRAM_RESOURCE = 'programs';
export const PROGRAM_CATEGORY_RESOURCE = 'program-categories';

// TODO(backend): GET/POST /api/programs · PUT/DELETE /api/programs/:id
export const programAdapter = createStoreAdapter<Program, ProgramInput>({
  scope: PROGRAM_RESOURCE,
  list: listPrograms,
  getOne: getProgram,
  add: addProgram,
  update: updateProgram,
  remove: removeProgram,
});

// TODO(backend): GET/POST /api/programs/categories · PUT/DELETE /api/programs/categories/:id (사용 중이면 409)
export const programCategoryAdapter = createStoreAdapter<
  ProgramCategoryUsage,
  ProgramCategoryInput
>({
  scope: PROGRAM_CATEGORY_RESOURCE,
  list: listProgramCategoryUsage,
  getOne: getProgramCategoryUsage,
  add: (input) => addProgramCategory(input.name, input.parentId),
  update: (id, input) => updateProgramCategory(id, input.name, input.parentId),
  remove: removeProgramCategory,
});

/** 프로그램 폼의 카테고리 셀렉트(1Depth·2Depth) 가 읽는 전체 목록 */
export function fetchProgramCategoryOptions(
  signal?: AbortSignal,
): Promise<readonly ProgramCategory[]> {
  if (signal?.aborted === true) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  return Promise.resolve(listProgramCategories());
}

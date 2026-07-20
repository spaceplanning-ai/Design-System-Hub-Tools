// 인증서/특허 데이터 소스 어댑터
//
// [백엔드 연동 지점] 공용 CRUD 어댑터에 시드를 넣는다. 실제 연동 시 // TODO(backend) 로 교체.
// [더미] 실명·실제 회사명 금지. 이미지는 앱이 직접 서빙하는 자리표시 자산(public/fixtures/)을 가리킨다 —
// 예전에는 cdn.example.com 을 가리켰는데 그 호스트는 **실재하지 않아서** 화면마다 이미지가 깨지고
// 콘솔에 ERR_NAME_NOT_RESOLVED 가 쌓였다(전 라우트 순회에서 36건). 백엔드가 없는 픽스처 앱이라
// 외부 호스트는 영원히 해석되지 않는다 — 자리표시는 앱 안에 있어야 실제로 그려진다.
import { createCrudAdapter } from '../../../shared/crud';
import { sortCertificates } from './types';
import type { CertInput, CertItem } from './types';

const CERT_SEED: readonly CertItem[] = [
  {
    id: 'cert-1',
    name: 'ISO 9001 품질경영시스템 인증',
    issuer: '예시인증원',
    issuedOn: '2023-04-12',
    kind: 'certificate',
    imageUrl: '/fixtures/placeholder-image.svg',
  },
  {
    id: 'cert-2',
    name: '공간 배치 최적화 방법 특허',
    issuer: '특허청(예시)',
    issuedOn: '2022-09-01',
    kind: 'patent',
    imageUrl: '/fixtures/placeholder-image.svg',
  },
  {
    id: 'cert-3',
    name: '기업부설연구소 인정서',
    issuer: '예시산업진흥원',
    issuedOn: '2021-06-20',
    kind: 'certificate',
    imageUrl: '/fixtures/placeholder-image.svg',
  },
];

let seq = CERT_SEED.length;

// TODO(backend): GET/POST /api/company/certificates · GET/PUT/DELETE /api/company/certificates/:id
export const certificatesAdapter = createCrudAdapter<CertItem, CertInput>({
  scope: 'certificates',
  seed: CERT_SEED,
  build: (input) => {
    seq += 1;
    return { id: `cert-${String(seq)}`, ...input };
  },
  patch: (item, input) => ({ ...item, ...input }),
  sort: sortCertificates,
});

# CMS / 배포 설정

## 사이트 수정
기존 사이트는 HTML / CSS / JavaScript 구조를 그대로 사용합니다.

## 작품 관리
Pages CMS → **Works**에서 작품 추가/수정/삭제, 이미지, 설명, 공개 여부, 순서를 관리합니다.
작품 데이터는 `data/works.json`에 저장됩니다.

## 상세페이지 제작
GitHub에서 실제 HTML 상세페이지를 먼저 제작합니다.

## 상세페이지 연결
새 HTML을 추가한 뒤 Pages CMS → **Detail Pages**에서 페이지명과 실제 HTML 경로를 등록합니다.
그 다음 Pages CMS → **Works** → **상세 페이지**에서 해당 항목을 선택합니다.
현재 Detail Pages에 등록된 7개 경로는 기존 WORKS 링크를 보존한 메타데이터이며, 실제 HTML 파일은 아직 없습니다.

## 방명록 확인
Pages CMS → **Guestbook**에서 메시지를 확인하고 `승인 여부`를 관리하거나 삭제합니다.

## 배포
GitHub push → Cloudflare Pages 자동 배포

Cloudflare Pages 권장 설정:
- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `.`

## 필요한 Cloudflare Variables / Secrets
Cloudflare Dashboard → Workers & Pages → 프로젝트 → Settings → Variables and Secrets

- `GITHUB_TOKEN`: 이 저장소 Contents 쓰기 권한만 가진 Fine-grained PAT
- `GITHUB_OWNER`: `yeondu1176`
- `GITHUB_REPO`: `Portrfoilo`
- `GITHUB_BRANCH`: `main`
- `TURNSTILE_SITE_KEY`: Turnstile Site Key (선택, 운영 권장)
- `TURNSTILE_SECRET_KEY`: Turnstile Secret Key (선택, 운영 권장)

Secret Key와 GitHub Token은 HTML/JS나 저장소에 넣지 않습니다.

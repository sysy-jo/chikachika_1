# 부용고등학교 1학년 모의고사 분석 대시보드

2026학년도 3월·6월 모의고사의 학년 집계 자료를 시각화하는 정적 GitHub Pages 사이트입니다.

## 구성

- `index.html`: 대시보드 마크업과 네 가지 분석 화면
- `styles.css`: 반응형 화면 스타일
- `app.js`: 탭, 지표 계산, Chart.js 그래프 렌더링
- `data.js`: 학교 평균과 전국 통계 입력 데이터
- `.nojekyll`: GitHub Pages의 정적 파일 처리 설정

## 자료 입력

`data.js`의 과목별 `march`, `june`, `nationalMarch`, `nationalJune` 값에 확인된 원점수 평균을 입력합니다. 점수는 0~100 숫자로 기록합니다. 학교 평균 PDF는 `sources.school`, 전국 통계 PDF는 `sources.national` 배열에 제목과 URL을 남깁니다. 자료에 없는 표준편차, 등급, 순위는 추정하지 않습니다.

현재 대화에서 학교 평균 원본과 전국 통계 PDF를 확인할 수 없어 수치는 비워 두었습니다. 원본 자료가 제공되면 `data.js`에 반영해 전국 대비, 과목별 심층, 3→6월 흐름 및 학습 인사이트를 표시할 수 있습니다.

## 배포

GitHub Pages에서 `main` 브랜치의 루트 디렉터리를 게시 대상으로 설정합니다. Chart.js는 jsDelivr CDN에서 불러옵니다.


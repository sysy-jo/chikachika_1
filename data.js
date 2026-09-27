/*
 * Sources analyzed:
 * - Buyeong HS grade 1 March score summary PDF (school standard-score means)
 * - March national statistics workbook (raw score means and standard-score distributions)
 * - June national score-analysis PDF (raw score means)
 *
 * There are no Buyeong HS June/September score records in the supplied materials.
 * Do not infer school trends for those exams.
 */
window.EXAM_DATA = {
  school: "부용고등학교",
  grade: "1학년",
  year: 2026,
  subjects: [
    { id: "korean", name: "국어", schoolMarchStandard: 91.6, nationalMarchStandard: 99.9948, nationalMarchRaw: 55.49, nationalJuneRaw: 52.97, nationalRawMax: 100 },
    { id: "math", name: "수학", schoolMarchStandard: 92.5, nationalMarchStandard: 99.9887, nationalMarchRaw: 43.31, nationalJuneRaw: 37.67, nationalRawMax: 100 },
    { id: "english", name: "영어", schoolMarchStandard: null, nationalMarchStandard: null, nationalMarchRaw: 56.80, nationalJuneRaw: 57.85, nationalRawMax: 100 },
    { id: "history", name: "한국사", schoolMarchStandard: null, nationalMarchStandard: null, nationalMarchRaw: 26.17, nationalJuneRaw: 26.57, nationalRawMax: 50 },
    { id: "social", name: "사회탐구", schoolMarchStandard: 45.1, nationalMarchStandard: 49.9946, nationalMarchRaw: 28.67, nationalJuneRaw: 32.94, nationalRawMax: 50 },
    { id: "science", name: "과학탐구", schoolMarchStandard: 45.7, nationalMarchStandard: 49.9903, nationalMarchRaw: 22.92, nationalJuneRaw: 27.28, nationalRawMax: 50 }
  ],
  sources: {
    school: [{
      file: "성적일람표(3월 1학년 전체).pdf",
      locator: "학급별 표의 학교평균 행; 국어·수학·사회탐구·과학탐구 표준점수 평균",
      note: "학생별 자료는 게시하지 않고 학년 집계값만 반영"
    }],
    national: [
      {
        exam: "2026년 3월",
        file: "2-1. 2026학년도 3월 고1 전국연합학력평가 통계자료.xlsx",
        locator: "영역별 원점수 평균 및 표준편차 시트; 표준점수누적도수 시트",
        note: "전국 표준점수 평균은 점수별 인원을 가중해 계산"
      },
      {
        exam: "2026년 6월",
        file: "2026학년도 6월 고1 전국연합학력평가 성적 분석.pdf",
        locator: "PDF 7쪽, 영역별 원점수 평균 및 표준편차"
      }
    ]
  }
};

